import PrettyPrint from "@/app/components/prettyPrint";

export default function Home() {
    return (
        <div className="w-full h-full p-4 md:p-20 space-y-6">
            <h1 className="font-bold text-4xl text-center">checkwt</h1>
            <div className="w-full">Paste a JWT below that you&#39;d like to decode, validate, and verify.</div>
            <div className="flex md:flex-row flex-col gap-4">
                 <div className=" w-full h-full">
                    <div className="text-xl font-bold">JSON Web Token</div>
                    <textarea className="border border-gray-300 outline-blue-100 w-full resize-none rounded-lg h-139 p-4"></textarea>
                 </div>
                <div className="flex flex-col gap-4  w-full h-full">
                    <div className="">
                        <div className="text-xl font-bold">Decoded Header</div>
                        <div className="bg-gray-50 rounded-lg border border-gray-300 h-64 p-4">
                            <PrettyPrint data={{
                                "alg": "HS256",
                                "typ": "JWT"
                            }}/>
                        </div>
                    </div>
                    <div className="">
                        <div className="text-xl font-bold">Decoded Payload</div>
                        <div className="bg-gray-50 rounded-lg border border-gray-300 h-64 p-4">
                            <PrettyPrint data={{
                                "sub": "1234567890",
                                "name": "John Doe",
                                "admin": true,
                                "iat": 1516239022
                            }}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}