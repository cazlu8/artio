export function handleBase64(image64 = '') {
  return image64.replace(/^data:image\/\w+;base64,/, '');
}
