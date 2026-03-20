import { decodeToken } from './util.ts';

const sample_token = 'eyJhbGciOiJFZERTQSIsImtpZCI6IjAxOWQwMTY0LTdjNGMtNzA4YS04MjU3LTA2ODhjYmFiODQ3NyIsInR5cCI6IkpXVCJ9.eyJjb3VudHJ5IjoiZ2xvYmFsIiwiZGVzY3JpcHRpb24iOiIiLCJlbnZpcm9ubWVudCI6InRlc3QiLCJleHAiOjE4MDUzODA4NTUsImlhdCI6MTc3Mzg0NDg1NSwicHJvZHVjdCI6Imdsb2JhbGN1c3RvbWVyYWNjb3VudCJ9.jajR9nID-jtfUU2-qZrMcXKW4KQFBBulXVnwSMFuGnZefE_BPtrHAPxhIilIghxM1GHDRxhXv11Oi6PfrC3ZCw';

(async () => {
	try {
		const res = await decodeToken(sample_token);
		console.log('Decode result:', JSON.stringify(res, null, 2));
	} catch (err) {
		console.error('Error decoding token:', err);
	}
})();
