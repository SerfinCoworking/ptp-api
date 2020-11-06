// Signature of the callback
type CallBackFindIndex<T> = (
  value: T,
  index?: number,
  collection?: T[]
) => Promise<boolean>;


export const aFindIndex = async <T>( elements: T[], cb: CallBackFindIndex<T> ): Promise<number> => {
  for (const [index, element] of elements.entries()) {
    if (await cb(element, index, elements)) {
      return index;
    }
  }

  return -1;
}
