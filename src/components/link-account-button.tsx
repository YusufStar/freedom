"use client";

import { getAurinkoAuthUrl } from "~/lib/aurinko";
import { Button } from "./ui/button";

export const LinkAccountButton = () => {
    const handleLinkAccount = async () => {
        const authUrl = await getAurinkoAuthUrl('Google') 
        window.location.href = authUrl
    }

    return <Button onClick={handleLinkAccount} >Link Account</Button>
}