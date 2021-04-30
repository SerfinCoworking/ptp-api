import { GenericError } from "../common/errors.handler";
import IMovement from "../interfaces/movement.interface";
import IUser from "../interfaces/user.interface";
import Movement from "../models/movement.model";
import User from "../models/user.model";

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

export const createMovement = async (userReq: any, action: string, resource: string, target: string): Promise<void> => {
  const user: IUser | null = await User.findOne({_id: userReq._id});
  if (!user) throw new GenericError({property:"User", message: 'Usuario no encontrado', type: "RESOURCE_NOT_FOUND"});
  await Movement.create({
    user:
    {
      _id: user._id,
      username: user.username,
      profile: {
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          dni: user.profile.dni
      }
    },
    action,
    resource,
    target
  });   
}