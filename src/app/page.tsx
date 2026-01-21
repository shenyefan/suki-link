import { redirect } from "next/navigation";

export default function Home() {
    const homeUrl = process.env.HOME_URL;

    if (homeUrl) {
        redirect(homeUrl);
    } else {
        redirect("/dashboard");
    }

    return null;
}
