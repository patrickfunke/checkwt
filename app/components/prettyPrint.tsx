export default function PrettyPrint({ data }: { data: any }) {

    const PrettyPrint = ({ data }: { data: string }) => {
        const syntaxHighlight = (json: string) => {
            if (typeof json !== 'string' || json === null || json === 'object') {
                json = JSON.stringify(json, null, 2);
            }

            // Escape HTML characters
            json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

            // Split into lines and replace leading spaces with &nbsp;
            const lines = json.split('\n').map(line => {
                const match = line.match(/^( +)/);
                if (match) {
                    const spaces = match[1];
                    return '&nbsp;'.repeat(spaces.length) + line.slice(spaces.length);
                }
                return line;
            });
            // Join back to a string for highlighting
            let highlighted = lines.join('\n');

            // Highlight JSON
            highlighted = highlighted.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
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

            // Replace newlines with <br>
            highlighted = highlighted.replace(/\n/g, '<br>');
            return highlighted;
        };

        return (
            <pre
                className="json-pre font-mono"
                dangerouslySetInnerHTML={{ __html: syntaxHighlight(data) }}
            />
        );
    };


    return <PrettyPrint data={data} />;
};