const passport = require('passport');
const { Router } = require('express');
const jwt = require('jsonwebtoken');

const tokenList = {};
const router = new Router();

router.get('/status', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// We authenticate the user through passport -- see the signup authenticator in auth.js
router.post('/signup', passport.authenticate('signup', { session: false }), (req, res) => {
  res.status(200).json({ message: 'signup successful' });
});

// Ditto
router.post('/login', (req, res, next) => {
  passport.authenticate('login', (err, user) => {
    try {
      if (err) {
        next(err);
        return;
      }

      if (!user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      req.login(user, { session: false }, (error) => {
        if (error) return next(error);

        const body = {
          _id: user._id,
          email: user.email,
          name: user.name,
        };

        const token = jwt.sign({ user: body }, process.env.JWT_SECRET, { expiresIn: '5m' });
        const refreshToken = jwt.sign({ user: body }, process.env.JWT_REFRESH, { expiresIn: '1d' });

        // store tokens in cookie
        res.cookie('jwt', token);
        res.cookie('refreshJwt', refreshToken);

        // store tokens in server memory
        tokenList[refreshToken] = {
          token,
          refreshToken,
          email: user.email,
          _id: user._id,
          name: user.name,
        };

        // Send back the token to the user
        return res.status(200).json({ token, refreshToken });
      });
    } catch (error) {
      next(error);
    }
  })(req, res, next);
});

router.post('/token', (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken in tokenList) {
    const { email, _id, name } = tokenList[refreshToken];
    const body = { email, _id, name };
    const token = jwt.sign({ user: body }, process.env.JWT_SECRET, { expiresIn: 300 });

    // update jwt
    res.cookie('jwt', token);
    tokenList[refreshToken].token = token;

    res.status(200).json({ token });
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

router.post('/logout', (req, res) => {
  if (req.cookies) {
    const refreshToken = req.cookies.refreshJwt;
    if (refreshToken in tokenList) delete tokenList[refreshToken];
    res.clearCookie('refreshJwt');
    res.clearCookie('jwt');
  }

  res.status(200).json({ message: 'logged out' });
});

module.exports = router;
