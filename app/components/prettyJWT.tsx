export default function PrettyJWT({ token }: { token: string }) {
    const parts = token.split('.');

    const colors = ["#f87171", "#fbbf24", "#34d399", "#60a5fa", "#a78bfa", "#f472b6"];
    const syntaxHighlight = (token: string) => {
        return parts.map((part, index) => {
            const color = colors[index % colors.length];
            return `<span style="color: ${color}">${part}</span>`;
        }).join('<span style="color: #6b7280">.</span>'); // Add a dot between parts
    };
    return (
        <pre
            className="jwt-pre"
            dangerouslySetInnerHTML={{ __html: syntaxHighlight(token) }}
        />
    );

        
};