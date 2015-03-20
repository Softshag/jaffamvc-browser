
info = require '../package.json'
_ = require 'underscore'
fs = require 'fs'

exports.files = [
  'src/jaffamvc.js'
  'src/utils.js'
  'src/object.js'
  'src/list.js'
  'src/boot.js'
  'src/channel.js'
  'src/module.js'
  'src/region.js'
  'src/region-manager.js'
  'src/native-view.js'
  'src/view.js'
  'src/layout-view.js'
  'src/collection-view.js'
  'src/application.js'
]

exports.binary = info.name + "-" + info.version

exports.umd =
  header: (filename) ->
    o = _.pick(info,['name','version'])
    o.year = (new Date).getFullYear()

    _.template(fs.readFileSync('./wrap/header.js','utf8'))(o) + '\n\n'

  footer: "\n" + fs.readFileSync('./wrap/footer.js') + '\n'


exports.es6 =
  header: (filename) ->
    o = _.pick(info,['name','version'])
    o.year = (new Date).getFullYear()

    _.template(fs.readFileSync('./wrap/header-es6.js','utf8'))(o) + '\n\n'

  footer: "\n" + fs.readFileSync('./wrap/footer-es6.js') + '\n'

exports.pkg = info