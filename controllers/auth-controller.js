import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs/promises";
import path from "path";
import gravatar from "gravatar";
import { nanoid } from "nanoid";

import User from "../models/User.js";

import { HttpErrors, imgOptimizator, sendEmail } from "../utils/index.js";

import { controllerWrapper } from "../decorators/index.js";

const { JWT_SECRET } = process.env;

const signup = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    throw HttpErrors(409, "Email already exist");
  }

  let avatarURL = null;

  if (req.file) {
    const { path: oldPath, filename } = req.file;
    const pathSaveAvatar = path.join("public", "avatars", filename);

    await imgOptimizator(oldPath, pathSaveAvatar);

    avatarURL = path.join("avatars", filename);

    fs.unlink(oldPath);
  } else {
    const gravatarUrl = gravatar.url(email, {
      s: "250",
    });
    avatarURL = gravatarUrl;
  }

  const hashPassword = await bcrypt.hash(password, 10);
  const verificationToken = nanoid();

  const newUser = await User.create({
    ...req.body,
    password: hashPassword,
    avatarURL,
    verificationToken,
  });

  await sendEmail(email, verificationToken);

  res.status(201).json({
    email: newUser.email,
    subscription: newUser.subscription,
  });
};

const signin = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw HttpErrors(401, "Email or password invalid");
  }

  if (!user.verify) {
    throw HttpErrors(401, "Email not verify");
  }

  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw HttpErrors(401, "Email or password invalid");
  }

  const { _id: id } = user;

  const payload = {
    id,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
  await User.findByIdAndUpdate(id, { accessToken, refreshToken });

  res.json({
    accessToken,
    refreshToken,
    user: {
      email,
      subscription: user.subscription,
    },
  });
};

const getCurrent = (req, res) => {
  const { email, subscription } = req.user;

  res.json({
    email,
    subscription,
  });
};

const signout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { accessToken: "", refreshToken: "" });

  res.json({
    message: "Signout success",
  });
};

const refresh = async (req, res) => {
  try {
    const { id } = jwt.verify(req.body.refreshToken, JWT_SECRET);
    const user = await User.findById(id);

    if (!user) {
      throw HttpErrors(403);
    }

    const payload = {
      id,
    };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "4h" });
    const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
    await User.findByIdAndUpdate(id, { accessToken, refreshToken });

    res.json({
      accessToken,
      refreshToken,
    });
  } catch {
    throw HttpErrors(403);
  }
};

const updateSubscription = async (req, res) => {
  const { userId } = req.params;

  const result = await User.findByIdAndUpdate(userId, req.body, {
    new: true,
  });
  if (!result) {
    throw HttpErrors(404);
  }
  res.json(result);
};

const updateAvatar = async (req, res) => {
  console.log(req.params);
  const { userId } = req.params;

  if (!req.file) {
    throw HttpErrors(404);
  }

  const { path: oldPath, filename } = req.file;

  const pathSaveAvatar = path.join("public", "avatars", filename);

  await imgOptimizator(oldPath, pathSaveAvatar);

  const avatarURL = path.join("avatars", filename);

  fs.unlink(oldPath);

  const result = await User.findByIdAndUpdate(
    userId,
    { avatarURL },
    {
      new: true,
    }
  );
  if (!result) {
    throw HttpErrors(404);
  }

  res.json(result);
};

const verify = async (req, res) => {
  const { verificationToken } = req.params;
  const user = await User.findOne({ verificationToken });
  if (!user) {
    throw HttpErrors(404);
  }

  await User.findByIdAndUpdate(user._id, {
    verify: true,
    verificationToken: "null",
  });

  res.json({
    message: "Email verify success",
  });
};

const resendVerifyEmail = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpErrors(404, "email not found");
  }
  if (user.verify) {
    throw HttpErrors(400, "Email already verify");
  }

  await sendEmail(email, user.verificationToken);

  res.json({
    message: "Verify email resend success",
  });
};

export default {
  signup: controllerWrapper(signup),
  signin: controllerWrapper(signin),
  refresh: controllerWrapper(refresh),
  getCurrent: controllerWrapper(getCurrent),
  signout: controllerWrapper(signout),
  updateSubscription: controllerWrapper(updateSubscription),
  updateAvatar: controllerWrapper(updateAvatar),
  verify: controllerWrapper(verify),
  resendVerifyEmail: controllerWrapper(resendVerifyEmail),
};
