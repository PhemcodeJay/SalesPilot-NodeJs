ret = {}

ret.Tenant = require './tenant'
ret.Plan = require './plan'

#AMD
if (typeof define != 'undefined' && define.amd)
  define([], -> return ret)
#Node
else if (typeof module != 'undefined' && module.exports)
    module.exports = ret;