q = require 'q'

Plan = require './plan'

class GUID
  s4: ->
    Math.floor((1 + Math.random()) * 0x1000000000000000)
 
  create: () ->
    "#{@s4()}"

class Tenant
  constructor: (@uuid, @plan) ->

  #### CHECKING THE PLAN LIMITATIONS ####

  key: ->
    date = new Date()
    "#{@uuid}:#{date.getFullYear()}:#{date.getMonth()}:#{date.getDate()}"
  
  feature_key: (feature) ->
    "#{@key()}:#{feature}"

  amount_remaining_today: (knex, redis, feature) ->
    q.all([@get_plan(knex), redis.get(@feature_key(feature))])
    .spread((plan, count) ->
      if plan[feature] == -1
        return 1000000000
      else
        return plan[feature] - count
    )

  inc_feature_used_today: (redis, feature, number = 1) ->
    redis.incrby(@feature_key(feature), number)
    .then( => redis.expire(@feature_key(feature), 24*60*60))
    .then( -> number)

  #### END OF CHECKING THE PLAN LIMITATIONS ####

  get_plan: (knex) ->
    Plan.find(knex, @plan)



  resource: ->
    res = {
      id: @uuid
      plan : @plan
      message: "Welcome to the #{@plan} plan"
      config: Tenant.config_vars(@)
    }

Tenant.config_vars = (tenant) ->
  global.TenancyConfiguration.config_vars(tenant)

Tenant.init_tenant = (knex,uuid) ->
  global.TenancyConfiguration.init_tenant(knex, uuid)

Tenant.drop_tenant = (knex,uuid) ->
  global.TenancyConfiguration.drop_tenant(knex, uuid)

Tenant.create = (knex, plan, uuid = "tenant_#{new GUID().create()}") ->
  #TODO wrap in transaction
  now = new Date().toISOString() 
  q.when(
    knex("tenants").insert({uuid: uuid, plan: plan, created_at: now, updated_at: now})
    .then( -> Tenant.init_tenant(knex,uuid))
    .then( -> new Tenant(uuid, plan))
  )

Tenant.find = (knex, uuid) ->
  q.when(
    knex.select('uuid', 'plan').from("tenants").where({uuid: uuid})
    .then( (results) -> 
      if results.length == 0
        return null
      else
        new Tenant(results[0].uuid, results[0].plan)
    )
  )

Tenant.update_plan = (knex, uuid, plan) ->
  q.when(
    knex("tenants").where({uuid: uuid}).update({plan: plan})
    .then( -> Tenant.find(knex, uuid))
  )


### DATABASE INIT METHODS ###

Tenant.init_tenants_table = (knex) ->
  knex.schema.createTable("tenants", (table) ->
    table.increments();
    table.string('uuid').index().notNullable().unique()
    table.string('plan').index().notNullable()
    table.timestamps();
  )

Tenant.drop_tenants_table = (knex) ->
  knex.schema.dropTableIfExists("tenants")

Tenant.drop_tables = (knex) ->
  q.all([Tenant.drop_tenants_table(knex), Plan.drop_plans_table(knex)])

Tenant.init_tables = (knex) ->
  q.all([Tenant.init_tenants_table(knex), Plan.init_plans_table(knex)])


Tenant.destroy = (knex, uuid) ->
  Tenant.find(knex, uuid)
  .then( (tenant) ->
    if tenant == null
      null
    else
      knex("tenants").where({uuid: tenant.uuid}).del()
      .then( -> Tenant.drop_tenant(knex,uuid))
      .then( -> tenant)
  )

#AMD
if (typeof define != 'undefined' && define.amd)
  define([], -> return Tenant)
#Node
else if (typeof module != 'undefined' && module.exports)
    module.exports = Tenant;