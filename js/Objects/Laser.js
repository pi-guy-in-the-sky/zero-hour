export default class Laser extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y);

    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);

    this.damage = 400;
    this.speed = 750;
  }

  init(type) {
    this.setName(type);
    this.play(type);

    if (this.name.startsWith('missile')) {
      this.speed = 500;
      this.damage = 600;
    }
    return this;
  }

  preUpdate() {
    if (this.name.startsWith('missile')) {
      if (this.target === null)
        this.findTarget();
      else {
        if (!this.target.body) this.target = null;
        else this.scene.physics.moveToObject(this, this.target, this.speed);
      }
    }

    if (!Phaser.Geom.Rectangle.ContainsPoint(this.scene.physics.world.bounds, this)) this.destroy();
  }

  fire(x, y, angle) {
    this.body.reset(x, y);
    if (this.scene.registry.get('soundOn')) this.scene.sound.play(Phaser.Math.RND.pick(['laser', 'laser1', 'laser2']));

    if (this.name.startsWith('missile')) {
      this.findTarget();
    } else {
      this.setRotation(angle);

      this.scene.physics.velocityFromRotation(angle - Math.PI / 2, this.speed, this.body.velocity);
      this.body.velocity.scale(2);
    }
  }

  findTarget() {
    const { width, height } = this.scene.cameras.main;
    this.target = null;
    let min = Phaser.Math.Distance.Between(0, 0, width, height);

    this.scene.enemies.children.each(child => {
      let dist = Phaser.Math.Distance.Between(this.x, this.y, child.x, child.y);
      if (dist < min) {
        min = dist;
        this.target = child;
      }
    });
  }
}