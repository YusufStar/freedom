import Mail from "./mail";

export default function MailDashboard() {
    return <Mail 
        defaultLayout={[20, 32, 48]}
        navCollapsedSize={4}
        defaultIsCollapsed={false}
    />
}