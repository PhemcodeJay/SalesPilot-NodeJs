q = require 'q'

class Plan
  constructor: (@name, features) ->
    for k,v of features
      @[k] = v

Plan.find = (knex, name) ->
  q.when(
    knex("plans").where({name: name})
    .then( (results) ->
      if results.length == 0
        return null
      else
        return new Plan(results[0].name, results[0].features)
    )
  )

Plan.create = (knex, name, features) ->
  knex("plans").insert({name: name, features: features})

Plan.init_plans_table = (knex) ->
  knex.schema.createTable("plans", (table) ->
    table.string('name').index().notNullable().unique()
    table.json('features')
  )

Plan.drop_plans_table = (knex) ->
  knex.schema.dropTableIfExists("plans")


#AMD
if (typeof define != 'undefined' && define.amd)
  define([], -> return Plan)
#Node
else if (typeof module != 'undefined' && module.exports)
    module.exports = Plan;