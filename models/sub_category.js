module.exports = (sequelize, DataTypes) => {
    const sub_category = sequelize.define(
      'sub_category',
      {
        subCategory_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        subcategory_name: {
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
          category_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
          },
      },
      {
        tableName: 'sub_category',
        timestamps: false,
      }
    );
  
    return sub_category;
  };
  
  