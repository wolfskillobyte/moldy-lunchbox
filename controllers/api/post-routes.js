const router = require('express').Router();
const { Post, User, Vote, Comment } = require('../../models');
const sequelize = require('../../config/connection');
const withAuth = require('../../utils/auth');

// get all users
router.get('/', (req, res) => {
  console.log('======================');
  Post.findAll({
    order: [['created_at', 'DESC']],
    // Query configuration
    attributes: [
      'id',
      'post_url',
      'title',
      'created_at',
      [
        sequelize.literal(
          '(SELECT COUNT(*) FROM vote WHERE post.id = vote.post_id)'
        ),
        'vote_count'
      ]
    ],
    include: [
      // comment model
      {
        model: Comment,
        attributes: ['id', 'post_url', 'title', 'created_at'],
        include: {
          model: User,
          attributes: ['username']
        }
      },
      {
        model: User,
        attributes: ['username']
      }
    ]
  })
    .then((dbPostData) => res.json(dbPostData))
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
});

// get a single post
router.get('/:id', (req, res) => {
  Post.findOne({
    where: {
      id: req.params.id
    },
    attributes: [
      'id',
      'post_url',
      'title',
      'created_at',
      [
        sequelize.literal(
          '(SELECT COUNT(*) FROM vote WHERE post.id = vote.post_id)'
        ),
        'vote_count'
      ]
    ],
    include: [
      // comment model
      {
        model: Comment,
        attributes: ['id', 'post_url', 'title', 'created_at'],
        include: {
          model: User,
          attributes: ['username']
        }
      },
      {
        model: User,
        attributes: ['username']
      }
    ]
  })
    .then((dbPostData) => {
      if (!dbPostData) {
        res.status(404).json({ message: 'No post found with this id' });
        return;
      }
      res.json(dbPostData);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
});

//create post
router.post('/', withAuth, (req, res) => {
  if (req.session) {
    Post.create({
      title: req.body.title,
      post_url: req.body.post_url,
      user_id: req.session.user_id
    })
      .then((dbPostData) => res.json(dbPostData))
      .catch((err) => {
        console.log(err);
        res.status(500).json(err);
      });
  }
});

// PUT /api/posts/upvote
router.put('/upvote', withAuth, (req, res) => {
  // custom static method created in models/Post.js
  // validate session
  if (req.session) {
    Post.upvote(
      { ...req.body, user_id: req.session.user_id },
      { Vote, Comment, User }
    )
      .then((updatedPostData) => res.json(updatedPostData))
      .catch((err) => {
        console.log(err);
        res.status(400).json(err);
      });
  }
});

// updAte post title
router.put('/:id', withAuth, (req, res) => {
  Post.update(
    {
      title: req.body.title
    },
    {
      where: {
        id: req.params.id
      }
    }
  )
    .then((dbPostData) => {
      if (!dbPostData) {
        res.status(404).json({ message: 'No post found with this id' });
        return;
      }
      res.json(dbPostData);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
});

// delete an entry
router.delete('/:id', withAuth, (req, res) => {
  Post.destroy({
    where: {
      id: req.params.id
    }
  })
    .then((dbPostData) => {
      if (!dbPostData) {
        res.status(404).json({ message: 'No post found with this id' });
        return;
      }
      res.json(dbPostData);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
});

module.exports = router;
