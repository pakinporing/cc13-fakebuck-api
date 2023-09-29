const { Op } = require('sequelize');
const { Friend } = require('../models');
const createError = require('../utils/create-error');
const { FRIEND_PENDING, FRIEND_ACCEPTED } = require('../config/constant');

exports.requestFriend = async (req, res, next) => {
  try {
    if (req.user.id === +req.params.userId) {
      createError('cannot request yourself', 400);
    }

    const existFriend = await Friend.findOne({
      where: {
        [Op.or]: [
          { requesterId: req.params.userId, accepterId: req.user.id },
          { requesterId: req.user.id, accepterId: req.params.userId }
        ]
      }
    });

    if (existFriend) {
      createError('already friend or pending', 400);
    }

    await Friend.create({
      requesterId: req.user.id,
      accepterId: req.params.userId,
      status: FRIEND_PENDING
    });
    res.status(200).json({ message: 'success friend request' });
  } catch (err) {
    next(err);
  }
};

exports.acceptFriend = async (req, res, next) => {
  try {
    const [totalRowUpdated] = await Friend.update(
      { status: FRIEND_ACCEPTED },
      {
        where: {
          requesterId: req.params.requesterId,
          accepterId: req.user.id
        }
      }
    );
    if (totalRowUpdated === 0) {
      createError('this user not sent request to you', 400);
    }
    res.status(200).json({ message: 'success add friend' });
  } catch (err) {
    next(err);
  }
};

exports.deleteFriend = async (req, res, next) => {
  try {
    const totalDelete = await Friend.destroy({
      where: {
        [Op.or]: [
          { requesterId: req.params.friendId, accepterId: req.user.id },
          { requesterId: req.user.id, accepterId: req.params.friendId }
        ]
      }
    });

    if (totalDelete === 0) {
      createError('you do not have relationship with this friend', 400);
    }

    res.status(204).json();
  } catch (err) {
    next(err);
  }
};
