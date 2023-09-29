const fs = require('fs');
const { Op } = require('sequelize');
const {
  FRIEND_ACCEPTED,
  STATUS_ME,
  STATUS_UNKNOWN,
  STATUS_FRIEND,
  STATUS_ACCEPTER,
  STATUS_REQUESTER
} = require('../config/constant');
const { User, Friend } = require('../models');
const createError = require('../utils/create-error');
const cloudinary = require('../utils/cloudinary');

exports.getUserInfoById = async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: {
        id: req.params.userId
      },
      attributes: {
        exclude: ['password']
      }
    });

    if (!user) {
      createError('user with this id is not found', 400);
    }

    const userFriends = await Friend.findAll({
      where: {
        status: FRIEND_ACCEPTED,
        [Op.or]: [
          { requesterId: req.params.userId },
          { accepterId: req.params.userId }
        ]
      },
      include: [
        { model: User, as: 'Requester', attributes: { exclude: ['password'] } },
        { model: User, as: 'Accepter', attributes: { exclude: ['password'] } }
      ]
    });

    const friends = userFriends.map(el =>
      el.requesterId === +req.params.userId ? el.Accepter : el.Requester
    );

    let statusWithAuthUser;
    if (req.user.id === +req.params.userId) {
      statusWithAuthUser = STATUS_ME;
    } else {
      const existFriend = await Friend.findOne({
        where: {
          [Op.or]: [
            { requesterId: req.params.userId, accepterId: req.user.id },
            { requesterId: req.user.id, accepterId: req.params.userId }
          ]
        }
      });
      if (!existFriend) {
        statusWithAuthUser = STATUS_UNKNOWN;
      } else if (existFriend.status === FRIEND_ACCEPTED) {
        statusWithAuthUser = STATUS_FRIEND;
      } else if (existFriend.requesterId === req.user.id) {
        statusWithAuthUser = STATUS_ACCEPTER;
      } else {
        statusWithAuthUser = STATUS_REQUESTER;
      }
    }

    res.status(200).json({
      user,
      friends,
      statusWithAuthUser
    });
  } catch (err) {
    next(err);
  }
};

exports.updateProfileImage = async (req, res, next) => {
  try {
    let value;
    const { profileImage, coverImage } = req.user;
    const profilePublicId = profileImage
      ? cloudinary.getPublicId(profileImage)
      : null;
    const coverPublicId = coverImage
      ? cloudinary.getPublicId(coverImage)
      : null;

    if (!req.files.profileImage && !req.files.coverImage) {
      createError('profile image or cover image is required');
    } else if (req.files.profileImage && req.files.coverImage) {
      const [profileImage, coverImage] = await Promise.all([
        cloudinary.upload(req.files.profileImage[0].path, profilePublicId),
        cloudinary.upload(req.files.coverImage[0].path, coverPublicId)
      ]);
      value = { profileImage, coverImage };
    } else if (req.files.profileImage) {
      const profileImage = await cloudinary.upload(
        req.files.profileImage[0].path,
        profilePublicId
      );
      value = { profileImage };
    } else {
      const coverImage = await cloudinary.upload(
        req.files.coverImage[0].path,
        coverPublicId
      );
      value = { coverImage };
    }

    await User.update(value, { where: { id: req.user.id } });
    res.status(200).json(value);
  } catch (err) {
    next(err);
  } finally {
    if (req.files.profileImage) {
      fs.unlinkSync(req.files.profileImage[0].path);
    }
    if (req.files.coverImage) {
      fs.unlinkSync(req.files.coverImage[0].path);
    }
  }
};
