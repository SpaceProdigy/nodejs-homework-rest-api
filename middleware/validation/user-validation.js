import { userSchema } from "../../schemas/index.js";

import { validateBody } from "../../decorators/index.js";

const userSignUPtValidate = validateBody(userSchema.userSignupSchema);
const userSignINValidate = validateBody(userSchema.userSigninSchema);
const userRefreshValidate = validateBody(userSchema.userRefreshTokenSchema);
const userSubscriptionValidate = validateBody(
  userSchema.userUpdateSubscriptionSchema
);
const userAvatarValidate = validateBody(userSchema.userUpdateAvatarSchema);
const userEmailValidate = validateBody(userSchema.userEmailValidateShema);

export default {
  userSignUPtValidate,
  userSignINValidate,
  userRefreshValidate,
  userSubscriptionValidate,
  userAvatarValidate,
  userEmailValidate,
};
