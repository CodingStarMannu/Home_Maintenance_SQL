

module.exports = (sequelize, DataTypes) => {

    const ReferCode = sequelize.define('refer_codes', {
      refer_code_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      refer_code: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        
      },
     
    },{
        tableName: 'refer_codes',
        timestamps:false
    }
    );
    return ReferCode
    
    }
    