const Joi = require('joi');

const validate = require('./validate');

const createPostSchema = Joi.object({
  title: Joi.string().trim(),
  image: Joi.string().trim()
}).or('title', 'image');

exports.validateCreatePost = validate(createPostSchema);
