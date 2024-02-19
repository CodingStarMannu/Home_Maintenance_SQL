module.exports = (sequelize, DataTypes) => {
  const company_detail = sequelize.define(
    "company_detail",
    {
      company_detail_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      vendor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      companyName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      firmType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      aboutCompany: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "company_detail",
      timestamps: true,
    }
  );
  return company_detail;
};
