import { Calendar } from "./_components/calendar";
import { cookies as getCookies } from "next/headers";

export default async function CalendarPage() {
  const cookieStore = await getCookies();

  const layoutCookie = cookieStore.get("react-resizable-panels:layout:calendar");
  const collapsedCookie = cookieStore.get("react-resizable-panels:collapsed");

  const defaultLayout = layoutCookie ? JSON.parse(layoutCookie.value) : undefined;
  const defaultCollapsed = collapsedCookie ? JSON.parse(collapsedCookie.value) : undefined;

  return (
    <div className="hidden md:flex flex-col h-screen overflow-hidden">
      <Calendar defaultLayout={defaultLayout} defaultCollapsed={defaultCollapsed} navCollapsedSize={4} />
    </div>
  );
}