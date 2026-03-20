export default function PrettyPrint({ data }: { data: any }) {
    const PrettyPrint = ({ data }: { data: Object }) => {
        const syntaxHighlight = (json: string) => {
            if (typeof json !== 'string' || json === null || json === 'object') {
                json = JSON.stringify(json, null, 2);
            }

            // Escape HTML characters
            json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

            return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
                let cls = 'number';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'key';
                    } else {
                        cls = 'string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'boolean';
                } else if (/null/.test(match)) {
                    cls = 'null';
                }
                return `<span class="${cls}">${match}</span>`;
            });
        };

        return (
            <pre
                className="json-pre"
                dangerouslySetInnerHTML={{ __html: syntaxHighlight(JSON.stringify(data, null, 2)) }}
            />
        );
    };
    return <PrettyPrint data={data} />;
};