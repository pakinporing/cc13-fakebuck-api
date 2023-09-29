module.exports = (sequelize, DataTypes) => {
  const Post = sequelize.define(
    'Post',
    {
      title: {
        type: DataTypes.STRING,
        validate: {
          notEmpty: true
        }
      },
      image: {
        type: DataTypes.STRING,
        validate: {
          notEmpty: true
        }
      }
    },
    { underscored: true }
  );

  Post.associate = db => {
    Post.belongsTo(db.User, {
      foreignKey: {
        name: 'userId',
        allowNull: false
      },
      onDelete: 'RESTRICT'
    });

    Post.hasMany(db.Comment, {
      foreignKey: {
        name: 'postId',
        allowNull: false
      },
      onDelete: 'RESTRICT'
    });

    Post.hasMany(db.Like, {
      foreignKey: {
        name: 'postId',
        allowNull: false
      },
      onDelete: 'RESTRICT'
    });
  };

  return Post;
};
