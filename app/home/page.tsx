import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

export default function Home() {
    return ( <>
    <FieldSet className="w-full max-w-md bg-gray-200 p-4 rounded-md">
        <FieldGroup>
            <Field>
            <FieldLabel htmlFor="jwt-token">
                <h2 className="text-lg font-medium">
                JWT Token
                </h2>
                
            </FieldLabel>
            <Textarea id="jwt-token" rows={10} placeholder="JWT Token" className="resize-none bg-gray-300" />
<FieldDescription>
    Please enter your JWT token.
</FieldDescription>
            </Field>
        </FieldGroup>

        

    </FieldSet>

    <FieldSet className="w-full max-w-md bg-gray-200 p-4 rounded-md">
        <FieldGroup>
            <Field>
            <FieldLabel htmlFor="jwt-token">
                <h2 className="text-lg font-medium">
                Header
                </h2>
                
            </FieldLabel>
            <Textarea 
              id="jwt-header" 
              rows={10} 
              placeholder="JWT Header" 
              className="resize-none bg-gray-300" 
              disabled
            />
<FieldDescription>
    Please enter your JWT token.
</FieldDescription>
            </Field>
        </FieldGroup>

        

    </FieldSet>

    <FieldSet className="w-full max-w-md bg-gray-200 p-4 rounded-md">
        <FieldGroup>
            <Field>
            <FieldLabel htmlFor="jwt-token">
                <h2 className="text-lg font-medium">
                Decoded Payload
                </h2>
                
            </FieldLabel>
            <Textarea 
              id="jwt-payload" 
              rows={10} 
              placeholder="JWT Payload" 
              className="resize-none bg-gray-300 disabled:cursor-text" 
              disabled
            />
<FieldDescription>
    Please enter your JWT token.
</FieldDescription>
            </Field>
        </FieldGroup>

        

    </FieldSet>
    </>
    );
}