module.exports = (sequelize, DataTypes) => {
    const vendorData = sequelize.define(
      'vendordata',
      {
        vendor_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        email: {
          type: DataTypes.STRING,
          allowNull: true,
          unique: true,
        },
        phone: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        password: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        is_verified: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        token: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        profile_created_month: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        profile_created_date: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        otpGeneratedAt:{
          type: DataTypes.DATE,
          allowNull: true,
        },
        OTP: {
          type: DataTypes.STRING,
          allowNull: true,
        },
      },
      {
        tableName: 'vendordata',
        timestamps: true,
      }
    );
  
    return vendorData;
  };
  
  