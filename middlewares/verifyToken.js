const jwt = require('jsonwebtoken');
module.exports = (req,res,next)=>{
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).json({message: 'No Token provided'});
    }
    const token = authHeader.split(' ')[1];

 jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });

   req.user = {
      userId: decoded.userId, // ← must match payload key!
    };
    next();
  });

}
