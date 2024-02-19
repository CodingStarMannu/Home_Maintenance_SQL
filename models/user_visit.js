module.exports = (sequelize, DataTypes) => {
  const user_visit = sequelize.define(
    "user_visit",
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "user_visit",
      timestamps: true,
    }
  );
  return user_visit;
};
