module.exports = (sequelize, DataTypes) => {
  const category = sequelize.define(
    "category",
    {
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      category_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      image: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_available: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "category",
      timestamps: false,
    }
  );

  return category;
};
