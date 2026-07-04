export async function sealSecret(value: string, base64PublicKey: string): Promise<string> {
  const sodium = (await import('libsodium-wrappers')).default
  await sodium.ready

  const publicKey = sodium.from_base64(base64PublicKey, sodium.base64_variants.ORIGINAL)
  const sealed = sodium.crypto_box_seal(sodium.from_string(value), publicKey)

  return sodium.to_base64(sealed, sodium.base64_variants.ORIGINAL)
}
