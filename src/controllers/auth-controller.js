const {
  validateRegister,
  validateLogin
} = require('../validators/auth-validators');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { User } = require('../models');
const createError = require('../utils/create-error');

exports.register = async (req, res, next) => {
  try {
    const value = validateRegister(req.body);

    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: value.email || '' }, { mobile: value.mobile || '' }]
      }
    });
    if (user) {
      createError('email or mobile is already in use', 400);
    }

    value.password = await bcrypt.hash(value.password, 12);
    await User.create(value);

    res
      .status(201)
      .json({ message: 'register success. please log in to continue.' });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const value = validateLogin(req.body);

    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: value.emailOrMobile },
          { mobile: value.emailOrMobile }
        ]
      }
    });
    if (!user) {
      createError('invalid email or mobile or password', 400);
    }

    const isCorrect = await bcrypt.compare(value.password, user.password);
    if (!isCorrect) {
      createError('invalid email or mobile or password', 400);
    }

    const accessToken = jwt.sign(
      {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobile: user.mobile,
        profileImage: user.profileImage,
        coverImage: user.coverImage,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: process.env.JWT_EXPIRES_IN
      }
    );

    res.status(200).json({ accessToken });
  } catch (err) {
    next(err);
  }
};

exports.getMe = (req, res, next) => {
  res.status(200).json({ user: req.user });
};
