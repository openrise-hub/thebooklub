import { PASSWORD_HASH_ITERATIONS, PASSWORD_SALT_LENGTH_BYTES } from "$lib/constants/auth";

export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(PASSWORD_SALT_LENGTH_BYTES));
	const encoder = new TextEncoder();
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		encoder.encode(password),
		"PBKDF2",
		false,
		["deriveBits"],
	);

	const derivedKey = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt,
			iterations: PASSWORD_HASH_ITERATIONS,
			hash: "SHA-256",
		},
		keyMaterial,
		256,
	);

	const saltHex = Array.from(salt)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	const hashHex = Array.from(new Uint8Array(derivedKey))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");

	return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
	try {
		const [saltHex, hashHex] = storedHash.split(":");
		if (!saltHex || !hashHex) return false;

		const salt = new Uint8Array(
			saltHex.match(/.{1,2}/g)?.map((byte) => Number.parseInt(byte, 16)) || [],
		);
		const encoder = new TextEncoder();
		const keyMaterial = await crypto.subtle.importKey(
			"raw",
			encoder.encode(password),
			"PBKDF2",
			false,
			["deriveBits"],
		);

		const derivedKey = await crypto.subtle.deriveBits(
			{
				name: "PBKDF2",
				salt,
				iterations: PASSWORD_HASH_ITERATIONS,
				hash: "SHA-256",
			},
			keyMaterial,
			256,
		);

		const derivedHex = Array.from(new Uint8Array(derivedKey))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");

		return derivedHex === hashHex;
	} catch {
		return false;
	}
}
