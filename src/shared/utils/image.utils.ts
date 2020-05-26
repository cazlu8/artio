export function handleBase64(image64: string = '') {
  return image64.replace(/^data:image\/\w+;base64,/, '');
}
