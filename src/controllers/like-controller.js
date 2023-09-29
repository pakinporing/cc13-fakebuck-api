const { Like, User } = require('../models');
const createError = require('../utils/create-error');

exports.createLike = async (req, res, next) => {
  try {
    const existLike = await Like.findOne({
      where: {
        userId: req.user.id,
        postId: req.params.postId
      }
    });

    if (existLike) {
      createError("you've already liked this post", 400);
    }

    const newLike = await Like.create({
      userId: req.user.id,
      postId: req.params.postId
    });

    const like = await Like.findOne({
      where: { id: newLike.id },
      include: { model: User }
    });
    res.status(201).json({ like });
  } catch (err) {
    next(err);
  }
};

exports.unlike = async (req, res, next) => {
  try {
    const existLike = await Like.findOne({
      where: {
        userId: req.user.id,
        postId: req.params.postId
      }
    });

    if (!existLike) {
      createError("you've never liked this post", 400);
    }

    await existLike.destroy();
    res.status(204).json();
  } catch (err) {
    next(err);
  }
};
