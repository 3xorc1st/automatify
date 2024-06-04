/* eslint-disable camelcase */
import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { clerkClient } from "@clerk/clerk-sdk-node"; // Correct import

import { createUser, deleteUser, updateUser } from "@/lib/actions/user.actions";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local"
    );
  }

  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  if (evt.data.object === "user") {
    const user = evt.data as any; // Ensure proper type

    const { id, email_addresses, image_url, username, first_name, last_name } = user;

    switch (evt.type) {
      case "user.created": {
        const newUser = await createUser({
          clerkId: id,
          email: email_addresses[0].email_address,
          username: username!,
          firstName: first_name,
          lastName: last_name,
          photo: image_url,
        });

        if (newUser) {
          await clerkClient.users.updateUserMetadata(id, {
            publicMetadata: {
              userId: newUser._id,
            },
          });
        }

        return NextResponse.json({ message: "OK", user: newUser });
      }

      case "user.updated": {
        const updatedUser = await updateUser(id, {
          firstName: first_name,
          lastName: last_name,
          username: username!,
          photo: image_url,
        });

        return NextResponse.json({ message: "OK", user: updatedUser });
      }

      case "user.deleted": {
        const deletedUser = await deleteUser(id!);

        return NextResponse.json({ message: "OK", user: deletedUser });
      }
    }
  }

  console.log(`Webhook with an ID of ${evt.data.id} and type of ${evt.type}`);
  console.log("Webhook body:", body);

  return new Response("", { status: 200 });
}