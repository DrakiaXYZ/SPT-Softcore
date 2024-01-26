import { DependencyContainer } from "tsyringe"
import * as fs from 'fs';
import * as path from 'path';
import * as json5 from 'json5';

import { IPostDBLoadMod } from "@spt-aki/models/external/IPostDBLoadMod"
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer"
import { ConfigServer } from "@spt-aki/servers/ConfigServer"
import { ConfigTypes } from "@spt-aki/models/enums/ConfigTypes"
import { ILogger } from "@spt-aki/models/spt/utils/ILogger"
import { ITraderConfig } from "@spt-aki/models/spt/config/ITraderConfig"
import { IRagfairConfig } from "@spt-aki/models/spt/config/IRagfairConfig"
import { IHideoutConfig } from "@spt-aki/models/spt/config/IHideoutConfig"
import { IInsuranceConfig } from "@spt-aki/models/spt/config/IInsuranceConfig"
import { IScavCaseConfig } from "@spt-aki/models/spt/config/IScavCaseConfig"
import { Traders } from "@spt-aki/models/enums/Traders"
import { ITrader } from "@spt-aki/models/eft/common/tables/ITrader";
import { Money } from "@spt-aki/models/enums/Money"
import { BaseClasses } from "@spt-aki/models/enums/BaseClasses"
import { HideoutAreas } from "@spt-aki/models/enums/HideoutAreas"
import { IHideoutProduction } from "@spt-aki/models/eft/hideout/IHideoutProduction";

// import { LogTextColor } from "@spt-aki/models/spt/logging/LogTextColor"
// import { LogBackgroundColor } from "@spt-aki/models/spt/logging/LogBackgroundColor"

// import { ObjectId } from "@spt-aki/utils/ObjectId" // [Debug]

// import * as fs from "fs" // [Debug] Used for file saving

import { itemBaseClasses } from "./itemBaseClasses"
import { BSGblacklist } from "./BSGblacklist"
import { scavcaseWhitelist, scavcaseItemBlacklist } from "./scavcaseLists"
//import { Items } from './items'
import * as Items from './items.json';

//const fleaListingsWhitelist = require("../config/fleaListingsWhitelist.ts") // this Node.js module/require shit is bullshit.
//const fleaBarterRequestsWhitelist = require("../config/fleaBarterRequestsWhitelist.ts") // why I can't use import in config directory? Anyway, is there any alternative to JSON data storage? THIS is the only way to save commented data?!
//const fleaItemsWhiteList = require("../config/fleaItemsWhitelist.ts")

const fleaListingsWhitelist = loadConfig("../config/fleaListingsWhitelist.json5");
const fleaBarterRequestsWhitelist = loadConfig("../config/fleaBarterRequestsWhitelist.json5");
const fleaItemsWhiteList = loadConfig("../config/fleaItemsWhitelist.json5");
const config = loadConfig("../config/config.json5");
const collectorQuestPatch = loadConfig("../config/collectorQuestPatch.json5");
const collectorRequirements = collectorQuestPatch.requirements;
const collectorTableTextPatchEN = collectorQuestPatch.tableTextPatchEN;

const debug = false // [Debug] Debug!

class Mod implements IPostDBLoadMod {
	public postDBLoad(container: DependencyContainer): void {
		const logger = container.resolve<ILogger>("WinstonLogger")
		const databaseServer = container.resolve<DatabaseServer>("DatabaseServer")
		const configServer = container.resolve<ConfigServer>("ConfigServer")
		// const ObjectId = container.resolve<ObjectId>("ObjectId") // [Debug]
		const tables = databaseServer.getTables()
		const locales = tables.locales.global
		const items = tables.templates.items
		const handbook = tables.templates.handbook
		const prices = tables.templates.prices
		const globals = tables.globals.config
		const traderConfig = configServer.getConfig<ITraderConfig>(ConfigTypes.TRADER)
		const ragfairConfig = configServer.getConfig<IRagfairConfig>(ConfigTypes.RAGFAIR)
		const hideoutConfig = configServer.getConfig<IHideoutConfig>(ConfigTypes.HIDEOUT)
		const insuranceConfig = configServer.getConfig<IInsuranceConfig>(ConfigTypes.INSURANCE)
		const scavcaseConfig = configServer.getConfig<IScavCaseConfig>(ConfigTypes.SCAVCASE)
		const prapor = tables.traders[Traders.PRAPOR]
		const therapist = tables.traders[Traders.THERAPIST]
		const ragman = tables.traders[Traders.RAGMAN]
		const jaeger = tables.traders[Traders.JAEGER]
		const mechanic = tables.traders[Traders.MECHANIC]
		const peacekeeper = tables.traders[Traders.PEACEKEEPER]
		const skier = tables.traders[Traders.SKIER]
		const traderlist = [prapor, therapist, ragman, jaeger, mechanic, peacekeeper, skier]
		const profileList = ["Standard", "Left Behind", "Prepare To Escape", "Edge Of Darkness", "SPT Zero to hero"]

		const euroPrice = handbook.Items.find((x) => x.Id == Money.EUROS).Price

		const collectorQuest = "5c51aac186f77432ea65c552";

		// Noice.
		const fleaBarterRequestBlacklist = itemBaseClasses.filter((x) => !fleaBarterRequestsWhitelist.includes(x))

		if (debug) {
			// [Debug]
			for (const i in items) {
				const item = items[i]
				if (item._type == "Item" && item._props.CanSellOnRagfair == false) {
					log(`"${item._id}", // ${getItemName(item._id)}`)
					// log(`"${item._id}", // ${item._name}`)
				}
			}
		}

		logger.info(`[SPT-Softcore] Starting...`);
		if (config.SecureContainersOptions.enabled) {
			logger.info(`[SPT-Softcore] SecureContainersOptions enabled`);
			if (config.SecureContainersOptions.Bigger_Containers.enabled) {
				logger.info(`[SPT-Softcore] Bigger Containers enabled`);
				// Waist Pouch
				items[Items.SECURE_WAIST_POUCH]._props.Grids[0]._props.cellsV = 2
				items[Items.SECURE_WAIST_POUCH]._props.Grids[0]._props.cellsH = 4

				// Secure container Alpha
				items[Items.SECURE_ALPHA]._props.Grids[0]._props.cellsV = 3
				items[Items.SECURE_ALPHA]._props.Grids[0]._props.cellsH = 3

				// Secure container Beta
				items[Items.SECURE_BETA]._props.Grids[0]._props.cellsV = 3
				items[Items.SECURE_BETA]._props.Grids[0]._props.cellsH = 4

				// Secure container Epsilon
				items[Items.SECURE_EPSILON]._props.Grids[0]._props.cellsV = 3
				items[Items.SECURE_EPSILON]._props.Grids[0]._props.cellsH = 5

				// Secure container Gamma
				items[Items.SECURE_GAMMA]._props.Grids[0]._props.cellsV = 4
				items[Items.SECURE_GAMMA]._props.Grids[0]._props.cellsH = 5

				// Secure container Kappa
				items[Items.SECURE_KAPPA]._props.Grids[0]._props.cellsV = 5
				items[Items.SECURE_KAPPA]._props.Grids[0]._props.cellsH = 5
			}

			if (config.SecureContainersOptions.Progressive_Containers.enabled) {
				logger.info(`[SPT-Softcore] Progressive Containers enabled`);
				try {
					// It seems Waist pouch does not protect againt in raid restrictions, so need to remove them alltogether.

					// items[Items.SECURE_GAMMA]._props.Grids[0]._props.filters[0].Filter.forEach(x => log(getItemName(x)))
					// items[Items.SECURE_WAIST_POUCH]._props.Grids[0]._props.filters[0].Filter.forEach(x => log(getItemName(x)))

					// log(`---`)
					// items[Items.SECURE_GAMMA]._props.Grids[0]._props.filters[0].ExcludedFilter.forEach(x => log(getItemName(x)))
					// items[Items.SECURE_WAIST_POUCH]._props.Grids[0]._props.filters[0].ExcludedFilter.forEach(x => log(getItemName(x)))

					try {
						logger.info(`[SPT-Softcore] Prevent Secure Waist Puch from being dropped in raid`);
						items[Items.SECURE_WAIST_POUCH]._props.CantRemoveFromSlotsDuringRaid[0] = "SecuredContainer"
					} catch (error) {
						logger.warning(`\nAdjusting Waist Pouch CantRemoveFromSlotsDuringRaid failed because of another mod. Send bug report. Continue safely.`)
						log(error)
					}
					try {
						items[Items.SECURE_WAIST_POUCH]._props.Grids[0]._props.filters = items[Items.SECURE_GAMMA]._props.Grids[0]._props.filters
					} catch (error) {
						logger.warning(`\nAdjusting Waist Pouch Grids[0]._props.filters failed because of another mod. Send bug report. Continue safely.`)
						log(error)
					}

					for (const profile of profileList) {
						tables.templates.profiles[profile].bear.character.Inventory.items.find((x) => x.slotId == "SecuredContainer")._tpl = Items.SECURE_WAIST_POUCH
						tables.templates.profiles[profile].usec.character.Inventory.items.find((x) => x.slotId == "SecuredContainer")._tpl = Items.SECURE_WAIST_POUCH
					}

					// Beta container from PK "removal"
					const betaBarterId = peacekeeper.assort.items.find((x) => x._tpl == Items.SECURE_BETA)._id;
					peacekeeper.assort.barter_scheme[betaBarterId][0].forEach((x) => (x.count = 10))

					const alphaCase: IHideoutProduction = {
						_id: "63da4dbee8fa73e22500001a",

						areaType: HideoutAreas.WORKBENCH,
						requirements: [
							{
								areaType: HideoutAreas.WORKBENCH,
								requiredLevel: 1,
								type: "Area"
							},
							{
								templateId: Items.LOCKABLECONTAINER_PISTOL_CASE,
								count: 2,
								isFunctional: false,
								type: "Item",
							},
							{
								templateId: Items.CONTAINER_WALLET,
								count: 2,
								isFunctional: false,
								type: "Item",
							},
							{
								templateId: Items.CONTAINER_DOGTAGS,
								count: 2,
								isFunctional: false,
								type: "Item",
							},
							{
								templateId: Items.INFO_FLASH_DRIVE,
								count: 2,
								isFunctional: false,
								type: "Item",
							},
						],
						productionTime: 5600,
						endProduct: Items.SECURE_ALPHA,
						continuous: false,
						count: 1,
						productionLimitCount: 0,
						isEncoded: false,
						locked: false,
						needFuelForAllProductionTime: false
					}
					const betaCase: IHideoutProduction = {
						_id: "63da4dbee8fa73e22500001b",

						areaType: HideoutAreas.WORKBENCH,
						requirements: [
							{
								areaType: HideoutAreas.WORKBENCH,
								requiredLevel: 1,
								type: "Area"
							},
							{
								templateId: Items.SECURE_ALPHA,
								count: 2,
								isFunctional: false,
								type: "Item",
							},
							{
								templateId: Items.CONTAINER_AMMO,
								count: 2,
								isFunctional: false,
								type: "Item",
							},
							{
								templateId: Items.CONTAINER_DOCS,
								count: 2,
								isFunctional: false,
								type: "Item",
							},
							{
								templateId: Items.INFO_MFD,
								count: 2,
								isFunctional: false,
								type: "Item",
							},
						],
						productionTime: 10800,
						endProduct: Items.SECURE_BETA,
						continuous: false,
						count: 1,
						productionLimitCount: 0,
						isEncoded: false,
						locked: false,
						needFuelForAllProductionTime: false
					}
					const epsilonCase: IHideoutProduction = {
						_id: "63da4dbee8fa73e22500001c",

						areaType: HideoutAreas.WORKBENCH,
						requirements: [
							{
								areaType: HideoutAreas.WORKBENCH,
								requiredLevel: 2,
								type: "Area"
							},
							{
								templateId: Items.SECURE_BETA,
								count: 2,
								isFunctional: false,
								type: "Item",
							},
							{
								templateId: Items.CONTAINER_MAGAZINES,
								count: 2,
								isFunctional: false,
								type: "Item",
							},
							{
								templateId: Items.CONTAINER_KEY_TOOL,
								count: 2,
								isFunctional: false,
								type: "Item",
							},
							{
								templateId: Items.CONTAINER_KEYCARDS,
								count: 2,
								isFunctional: false,
								type: "Item",
							},
							{
								templateId: Items.INFO_SMT,
								count: 2,
								isFunctional: false,
								type: "Item",
							},
						],
						productionTime: 35000,
						endProduct: Items.SECURE_EPSILON,
						continuous: false,
						count: 1,
						productionLimitCount: 0,
						isEncoded: false,
						locked: false,
						needFuelForAllProductionTime: false
					}
					const gammaCase: IHideoutProduction = {
						_id: "63da4dbee8fa73e22500001d",

						areaType: HideoutAreas.WORKBENCH,
						requirements: [
							{
								areaType: HideoutAreas.WORKBENCH,
								requiredLevel: 3,
								type: "Area"
							},
							{
								templateId: Items.SECURE_EPSILON,
								count: 2,
								isFunctional: false,
								type: "Item",
							},

							{
								templateId: Items.CONTAINER_GRENADES,
								count: 2,
								isFunctional: false,
								type: "Item",
							},
							{
								templateId: Items.CONTAINER_MONEY,
								count: 2,
								isFunctional: false,
								type: "Item",
							},
							{
								templateId: Items.CONTAINER_SICC,
								count: 2,
								isFunctional: false,
								type: "Item",
							},
							{
								templateId: Items.CONTAINER_INJECTORS,
								count: 2,
								isFunctional: false,
								type: "Item",
							},
							{
								templateId: Items.BARTER_MB,
								count: 2,
								isFunctional: false,
								type: "Item",
							},
						],
						productionTime: 61200,
						endProduct: Items.SECURE_GAMMA,
						continuous: false,
						count: 1,
						productionLimitCount: 0,
						isEncoded: false,
						locked: false,
						needFuelForAllProductionTime: false
					}

					logger.info(`[SPT-Softcore] Adding progressive containers to hideout crafts...`);
					tables.hideout.production.push(alphaCase, betaCase, epsilonCase, gammaCase)

					if (config.SecureContainersOptions.Progressive_Containers.Collector_Quest_Redone.enabled == true) {
						logger.info(`[SPT-Softcore] Collector Quest Redone enabled`);
						// Replace collectorQuest requirements with updated ones
						logger.info(`[SPT-Softcore] Removing ${tables.templates.quests[collectorQuest].conditions.AvailableForFinish.length} entries from Collector quest conditions...`);
						tables.templates.quests[collectorQuest].conditions.AvailableForFinish = [];
						logger.info(`[SPT-Softcore] Adding ${collectorRequirements.length} entries to Collector quest conditions...`);
						for (const condition of collectorRequirements) {
							tables.templates.quests[collectorQuest].conditions.AvailableForFinish.push(condition);
						}
						logger.info(`[SPT-Softcore] Updating Collector quest item text...`);
						for (const tableTextPatch of collectorTableTextPatchEN) {
							tables.locales.global["en"][tableTextPatch.id] = tableTextPatch.text;
						}

						tables.locales.global["ru"]["639135534b15ca31f76bc319"] = "Передать носитель" // Тут нужен только фикс для русского, для всех остальных языков звучит как "Hand over the storage device"

						// Remove level req from finish
						tables.templates.quests[collectorQuest].conditions.AvailableForFinish = tables.templates.quests[
							collectorQuest
						].conditions.AvailableForFinish.filter((x) => x._parent != "Level")

						// Start condition
						tables.templates.quests[collectorQuest].conditions.AvailableForStart = [
							{
								_parent: "Level",
								_props: {
									id: "51d33b2d4fad9e61441772c0",
									index: 1,
									parentId: "",
									isEncoded: false,
									dynamicLocale: false,
									value: config.SecureContainersOptions.Progressive_Containers.Collector_Quest_Redone.questLevel,
									compareMethod: ">=",
									visibilityConditions: [],
								},
								dynamicLocale: false,
							},
						]
					}
				} catch (error) {
					logger.warning(`\nSecureContainersOptions.Progressive_Containers failed because of another mod. Send bug report. Continue safely.`)
					log(error)
				}
			}
		}

		if (config.ScavCaseOptions.enabled) {
			logger.info(`[SPT-Softcore] ScavCaseOptions enabled`);
			try {
				if (config.ScavCaseOptions.BetterRewards.enabled) {
					logger.info(`[SPT-Softcore] BetterRewards enabled`);
					// buyableitems generator, to make sure rare unbuyable items always are in reward pool (eg anodised red gear)
					const buyableitems = new Set()
					for (const trader of traderlist) {
						try {
							trader.assort.items.filter((x) => buyableitems.add(x._tpl))
						} catch (error) {
							logger.warning(
								`trader.assort.items.filter for buyableitems function failed bacause of the other mod. Ignore this error safely and continue. Send bug report.`
							)
							log(error)
						}
					}

					// Shitlist generator for scav case rewards. Filters A LOT of crap out, but very conservatevely. Blacklist included in ./docs folder check it out.
					// Always includes items in carefully curated whitelist. Always includes unbuyable and/or cheap items not included in whitelist (such as anodized red gear, but also some crap like scav only hats). Always includes items worth > 10000. Filters everything else out. Spent a lot of time thinking about this, really proud of myself. In the end, just makes sure you almost always get something of valuable or usable.
					const scavWhitelist = [] // [Debug] used for debug code below
					for (const i in items) {
						const item = items[i]
						if (item._type == "Item") {
							if (debug) {
								item._props.ExaminedByDefault = true // For my sanity
							}
							const itemInHandbook = getItemInHandbook(item._id)

							if (item._parent == BaseClasses.AMMO_BOX) {
								try {
									// Ammo boxes price patch/fix, their data in handbook is always 1k, this makes them valued as ammo*count they contain.
									const count = item._props.StackSlots[0]._max_count
									const ammo = item._props.StackSlots[0]._props.filters[0].Filter[0]

									const value = Math.round(getItemInHandbook(ammo).Price * count)

									handbook.Items.find((x) => x.Id == item._id).Price = value
								} catch (error) {
									logger.warning(
										`handbook.Items.find((x) => x.Id == item._id).Price = value function failed bacause of the other mod. Ignore this error safely and continue. Send bug report.`
									)
									log(error)
								}
							}

							if (
								(itemInHandbook?.Price >= 10000 || scavcaseWhitelist.includes(item._parent) || !buyableitems.has(item._id)) &&
								!scavcaseItemBlacklist.includes(item._id) &&
								item._props.QuestItem != true &&
								itemInHandbook?.Price != undefined
								// && !scavcaseConfig.rewardItemParentBlacklist.includes(item._parent) // [Debug] not actually needed, used only for reference when generating black/whitelists. Ignore(? TODO: look into it) ammo and money here, they are a special case in SPI-AKI logic.
							) {
								// whitelist here, do nothing.
								if (debug) {
									scavWhitelist.push(item._id) // [Debug] used for debug code below
									// log(getItemName(item._parent) + "	" + itemInHandbook?.Price + "	" + getItemName(item._id) + "	" + item._id) // [Debug]
								}
							} else {
								scavcaseConfig.rewardItemBlacklist.push(item._id)
								// shitlist here.
								if (debug) {
									// log(getItemName(item._parent) + "	" + itemInHandbook?.Price + "	" + getItemName(item._id) + "	" + item._id) // [Debug]
								}
							}
						}
					}

					// Object.values(scavcaseConfig.ammoRewards.ammoRewardBlacklist).forEach(x => x.push(scavcaseItemBlacklist))
					// log(scavcaseConfig)
				}

				if (config.ScavCaseOptions.Rebalance.enabled) {
					logger.info(`[SPT-Softcore] Rebalance enabled`);
					scavcaseConfig.rewardItemValueRangeRub = {
						common: {
							// AVG 7941
							min: 1,
							max: 20000,
						},
						rare: {
							// AVG 36415
							min: 20001,
							max: 60000,
						},
						superrare: {
							// AVG 157978
							min: 60001,
							max: 1200000,
						},
					}

					const scavCaseRedone = [
						{
							EndProducts: {
								Common: {
									min: 2,
									max: 3,
								},
								Rare: {
									min: 0,
									max: 0,
								},
								Superrare: {
									min: 0,
									max: 0,
								},
							},
							ProductionTime: 2500,
							Requirements: [
								{
									count: 1,
									isEncoded: false,
									isFunctional: false,
									templateId: Items.DRINK_PEVKO,
									type: "Item",
								},
							],
							_id: "62710974e71632321e5afd5f",
						},
						{
							EndProducts: {
								Common: {
									min: 3,
									max: 4,
								},
								Rare: {
									min: 0,
									max: 1,
								},
								Superrare: {
									min: 0,
									max: 0,
								},
							},
							ProductionTime: 7700,
							Requirements: [
								{
									count: 1,
									isEncoded: false,
									isFunctional: false,
									templateId: Items.DRINK_VODKA,
									type: "Item",
								},
							],
							_id: "62710a8c403346379e3de9be",
						},

						{
							EndProducts: {
								Common: {
									min: 4,
									max: 5,
								},
								Rare: {
									min: 1,
									max: 2,
								},
								Superrare: {
									min: 0,
									max: 0,
								},
							},
							ProductionTime: 8100,
							Requirements: [
								{
									count: 1,
									isEncoded: false,
									isFunctional: false,
									templateId: Items.DRINK_WHISKEY,
									type: "Item",
								},
							],
							_id: "62710a69adfbd4354d79c58e",
						},
						{
							EndProducts: {
								Common: {
									min: 2,
									max: 3,
								},
								Rare: {
									min: 0,
									max: 3,
								},
								Superrare: {
									min: 1,
									max: 2,
								},
							},
							ProductionTime: 16800,
							Requirements: [
								{
									count: 1,
									isEncoded: false,
									isFunctional: false,
									templateId: Items.DRINK_MOONSHINE,
									type: "Item",
								},
							],
							_id: "6271093e621b0a76055cd61e",
						},
						{
							EndProducts: {
								Common: {
									min: 2,
									max: 3,
								},
								Rare: {
									min: 3,
									max: 5,
								},
								Superrare: {
									min: 0,
									max: 1,
								},
							},
							ProductionTime: 19200,
							Requirements: [
								{
									count: 1,
									isEncoded: false,
									isFunctional: false,
									templateId: Items.INFO_INTELLIGENCE,
									type: "Item",
								},
							],
							_id: "62710a0e436dcc0b9c55f4ec",
						},
					]

					try {
						tables.hideout.scavcase = scavCaseRedone // mi donta undestanda tem red wavy lines, tis bad? tis worka! tis gooda! donta cera wavy lines.
					} catch (error) {
						log(error) // Akey, mi kinda scary red ~~~ lines. Mi try-ketchup it.
					}
				}
				if (config.ScavCaseOptions.FasterScavcase.enabled) {
					logger.info(`[SPT-Softcore] FasterScavcase enabled`);
					try {
						tables.hideout.scavcase.forEach((x) => {
							if (debug) {
								x.ProductionTime = 1
								x.Requirements[0].templateId = Money.ROUBLES
							} else {
								x.ProductionTime /= config.ScavCaseOptions.FasterScavcase.SpeedMultiplier
							}
						})
					} catch (error) {
						logger.warning(`\nScavCaseOptions.FasterScavcase failed because of another mod. Send bug report. Continue safely.`)
						log(error)
					}
				}
				if (debug) {
					// Random WIP testing code here, I like it, I saved it, ignore it, or use it for debug or your mods.
					//
					// [Debug] Master item list logger OR, optionally filters based on parent class
					// Object.values(items)
					// 	// .filter((x) => x._parent == "543be6564bdc2df4348b4568")
					// 	.map((x) => {
					// 		const price = getItemInHandbook(x._id)?.Price
					// 		log(getItemName(x._parent) + ": " + getItemName(x._id) + ", " + price + " // " + x._id)
					// 	})
					//
					// [Debug] WIP item list logger with file saving, itterates all base classes and filters stuff. Strong stuff, can't remember what it actually does now, was using it to to balance tiers lists.
					// let gg = []
					// for (let i = 0; i < baseClasses.length; i++) {
					// 	const baseclass = baseClasses[i]
					// 	if (scavcaseBlacklist.includes(baseclass)) {
					// 		Object.values(items)
					// 			.filter((x) => x._parent == baseclass)
					// 			.map((x) => {
					// 				const price = getItemInHandbook(x._id)?.Price
					// 				if (price > 10000) {
					// 					gg.push(getItemName(x._parent) + "	" + getItemName(x._id) + "	" + price + "\n")
					// 				}
					// 			})
					// 	}
					// 	if (i == baseClasses.length - 1) {
					// 		const ggs = gg.toString()
					// 		fs.writeFile("./test_b.txt", ggs, (err) => {
					// 			if (err) {
					// 				console.error(err)
					// 			}
					// 			log("OK!")
					// 		})
					// 	}
					// }
					//
					// [Debug] Scavcase tier lists generators, enable scavWhitelist above.
					// const commonItems = scavWhitelist.filter(
					// 	(x) =>
					// 		getItemInHandbook(x).Price >= scavcaseConfig.rewardItemValueRangeRub.common.min &&
					// 		getItemInHandbook(x).Price <= scavcaseConfig.rewardItemValueRangeRub.common.max
					// )
					// const rareItems = scavWhitelist.filter(
					// 	(x) =>
					// 		getItemInHandbook(x).Price >= scavcaseConfig.rewardItemValueRangeRub.rare.min &&
					// 		getItemInHandbook(x).Price <= scavcaseConfig.rewardItemValueRangeRub.rare.max
					// )
					// const superrareItems = scavWhitelist.filter(
					// 	(x) =>
					// 		getItemInHandbook(x).Price >= scavcaseConfig.rewardItemValueRangeRub.superrare.min &&
					// 		getItemInHandbook(x).Price <= scavcaseConfig.rewardItemValueRangeRub.superrare.max
					// )
					// [Debug] Tier lists loggers
					// commonItems.map(x => log(getItemName(x) + " " + getItemInHandbook(x).Price + " " + x))
					// rareItems.map(x => log(getItemName(x) + " " + getItemInHandbook(x).Price + " " + x))
					// superrareItems.map(x => log(getItemName(x) + " " + getItemInHandbook(x).Price + " " + x))
					//
					// [Debug] AVG sum for tier calc
					//		let sum = 0
					//		for (let i = 0; i < superrareItems.length; i++) {
					//			const item = superrareItems[i]
					//
					//			sum += getItemInHandbook(item).Price
					//		}
					//		log(sum / superrareItems.length)
					//
					// [Debug] Comment generator with filter for ALL items, for white/black lists, shows item names
					// Object.values(items)
					// .filter((x) => x._props.CanSellOnRagfair == false && x._type == "Item")
					// .map((x) => log(`"${x._id}", // ${getItemName(x._id)}`));
					//
					// [Debug] Comment generator for white/black lists, shows item names, universally usefull for different arrays
					// itemWhitelist.map((x) => log(`"${x}", // ${getItemName(x)}`));
					//
					// [Debug] Stale code, filters and logs ALL items
					//	Object.values(items)
					//		.filter((x) => {
					//			const price = getItemInHandbook(x._id)?.Price
					//			return price >= 10000 && price <= 20000
					//		})
					//		.map((x) => {
					//			const price = getItemInHandbook(x._id)?.Price
					//			log(getItemName(x._id) + ": " + price)
					//		})
				}
			} catch (error) {
				logger.warning(`\nScavCaseOptions failed because of another mod. Send bug report. Continue safely.`)
				log(error)
			}
		}

		if (config.HideoutOptions.enabled) {
			logger.info(`[SPT-Softcore] HideoutOptions enabled`);
			if (config.HideoutOptions.StashOptions.enabled) {
				logger.info(`[SPT-Softcore] StashOptions enabled`);
				// Fix for ADHD.
				if (config.HideoutOptions.StashOptions.BiggerStash.enabled) {
					logger.info(`[SPT-Softcore] BiggerStash enabled`);
					try {
						items[Items.STASH_STANDARD]._props.Grids[0]._props.cellsV = 50
						items[Items.STASH_LEFTBEHIND]._props.Grids[0]._props.cellsV = 100
						items[Items.STASH_PREPAREFORESCAPE]._props.Grids[0]._props.cellsV = 150
						items[Items.STASH_EDGEOFDARKNESS]._props.Grids[0]._props.cellsV = 200
					} catch (error) {
						logger.warning(`\nHideoutOptions.StashOptions.BiggerStash failed because of another mod. Send bug report. Continue safely.`)
						log(error)
					}
				}

				const originalStages = tables.hideout.areas.find((x) => x.type == HideoutAreas.STASH).stages

				for (const stage in originalStages) {
					if (config.HideoutOptions.StashOptions.Easier_Loyalty.enabled == true) {
						logger.info(`[SPT-Softcore] Easier Loyalty enabled`);
						try {
							originalStages[stage].requirements
								.filter((x) => x.loyaltyLevel != undefined)
								.forEach((x) => {
									x.loyaltyLevel -= 1
								})
						} catch (error) {
							logger.warning(`\nHideoutOptions.StashOptions.Easier_Loyalty failed because of another mod. Send bug report. Continue safely.`)
							log(error)
						}
					}

					if (config.HideoutOptions.StashOptions.Less_Currency_For_Construction.enabled == true) {
						logger.info(`[SPT-Softcore] Less Currency For Construction enabled`);
						try {
							originalStages[stage].requirements
								.filter((x) => x.templateId == Money.ROUBLES || x.templateId == Money.EUROS)
								.forEach((x) => {
									x.count /= 10
								})
						} catch (error) {
							logger.warning(`\nHideoutOptions.StashOptions.Less_Currency_For_Construction failed because of another mod. Send bug report. Continue safely.`)
							log(error)
						}
					}
				}

				try {
					tables.hideout.areas.find((x) => x.type == HideoutAreas.STASH).stages = originalStages
				} catch (error) {
					logger.warning(
						`\nHideoutOptions.StashOptions (Easier_Loyalty or Less_Currency_For_Construction) failed because of another mod. Send bug report. Continue safely.`
					)
					log(error)
				}

				if (config.HideoutOptions.StashOptions.Progressive_Stash.enabled == true) {
					logger.info(`[SPT-Softcore] Progressive Stash enabled`);
					const basicStashBonuses = [
						{
							type: "StashSize",
							templateId: Items.STASH_STANDARD,
						},
					]
					for (const profile of profileList) {
						try {
							tables.templates.profiles[profile].bear.character.Hideout.Areas.find((x) => x.type == HideoutAreas.STASH).level = 1
							tables.templates.profiles[profile].usec.character.Hideout.Areas.find((x) => x.type == HideoutAreas.STASH).level = 1

							tables.templates.profiles[profile].bear.character.Inventory.items
								.filter((x) => x._tpl == Items.STASH_LEFTBEHIND || x._tpl == Items.STASH_PREPAREFORESCAPE || x._tpl == Items.STASH_EDGEOFDARKNESS)
								.forEach((element) => {
									element._tpl = Items.STASH_STANDARD
								})
							tables.templates.profiles[profile].usec.character.Inventory.items
								.filter((x) => x._tpl == Items.STASH_LEFTBEHIND || x._tpl == Items.STASH_PREPAREFORESCAPE || x._tpl == Items.STASH_EDGEOFDARKNESS)
								.forEach((element) => {
									element._tpl = Items.STASH_STANDARD
								})
							tables.templates.profiles[profile].bear.character.Bonuses = basicStashBonuses
							tables.templates.profiles[profile].usec.character.Bonuses = basicStashBonuses
						} catch (error) {
							logger.warning(`\nconfig.HideoutOptions.BiggerStash.Progressive_Stash error`)
							log(error)
						}
					}
				}
			}
			// 100x Faster hideout production, 10x superwater and moonshine production, bitcoins
			for (const prod in tables.hideout.production) {
				const endProduct = tables.hideout.production[prod].endProduct
				const productionTime = tables.hideout.production[prod].productionTime
				if (
					(endProduct == Items.DRINK_MOONSHINE || endProduct == Items.DRINK_SUPERWATER) &&
					config.HideoutOptions.Faster_Moonshine_and_Purified_Water_Production.enabled
				) {
					// superwater and moonshine
					tables.hideout.production[prod].productionTime = Math.round(
						productionTime / config.HideoutOptions.Faster_Moonshine_and_Purified_Water_Production.Base_Moonshine_And_Water_Time_Multiplier
					)
				} else if (endProduct == Items.BARTER_02BTC && config.HideoutOptions.Faster_Bitcoin_Farming.enabled == true) {
					// bitcoins
					tables.hideout.production[prod].productionTime = Math.round(
						productionTime / config.HideoutOptions.Faster_Bitcoin_Farming.Base_Bitcoin_Time_Multiplier
					)
					if (config.HideoutOptions.Faster_Bitcoin_Farming.Revert_Bitcoin_Price_To_v012 == true) {
						tables.templates.handbook.Items.find((x) => x.Id == Items.BARTER_02BTC).Price = 100000
					}
				} else if (config.HideoutOptions.Faster_Crafting_Time.enabled) {
					// all other crafts
					tables.hideout.production[prod].productionTime = Math.round(productionTime / config.HideoutOptions.Faster_Crafting_Time.Base_Crafting_Time_Multiplier)
				}
			}

			if (config.HideoutOptions.Faster_Crafting_Time.enabled && config.HideoutOptions.Faster_Crafting_Time.Hideout_Skill_Exp_Fix.enabled) {
				logger.info(`[SPT-Softcore] Faster Crafting Time Hideout Skill Exp Fix enabled`);
				// Buff to hideout exp rate, more testing needed
				hideoutConfig.hoursForSkillCrafting /= config.HideoutOptions.Faster_Crafting_Time.Hideout_Skill_Exp_Fix.Hideout_Skill_Exp_Multiplier
			}

			if (config.HideoutOptions.Faster_Bitcoin_Farming.enabled) {
				logger.info(`[SPT-Softcore] Faster Bitcoin Farming enabled`);
				// Instead of modifing base farming time try this:
				tables.hideout.settings.gpuBoostRate = config.HideoutOptions.Faster_Bitcoin_Farming.GPU_Efficiency

				// TODO: replace getBTCSlots() in HideoutHelper to add bonus slots per farm level. lv2 - 4 slots, lv3 - 5, elite - 7

				// Vanilla: Base time (x1): 40h 17min (2417 min), GPU Boost (0.041225): x1, each GPU has only ~4.12% efficiency
				// 2× GPU: 38h 41min x1.04
				// 10× GPU: 29h 23min x1.37
				// 25× GPU: 20h 15min x1.99
				// 50× GPU: 13h 20min x3.02

				// Softcore v0.1: Base time (x10): 4h 2min, GPU Boost (0.041225): x1
				// 2× GPU: 3h 52min x1.04
				// 10× GPU: 2h 56min x1.37
				// 25× GPU: 2h 1min x1.99
				// 50× GPU: 1h 20min x3.02

				// Softcore v0.2: Base time (x2): 20h 8min, GPU Boost(0.5): x12.13, each GPU has ~50% efficiency
				// 2× GPU: 13h 26min x1.5
				// 10× GPU: 3h 40min x5.5
				// 25× GPU: 1h 33min x13
				// 50× GPU: 0h 47min x25.5

				// Linear: Base time (x1): 40h 17min, GPU Boost (1): x24.26, each GPU is 100% efficient
				// 2× GPU: 20h 8min x2
				// 10× GPU: 4h 2min x10
				// 25× GPU: 1h 37min x25
				// 50× GPU: 0h 48min x50
			}

			if (config.HideoutOptions.Faster_Hideout_Construction.enabled) {
				logger.info(`[SPT-Softcore] Faster Hideout Construction enabled`);
				// 100x Faster hideout construction
				for (const area in tables.hideout.areas) {
					for (const stage in tables.hideout.areas[area].stages) {
						tables.hideout.areas[area].stages[stage].constructionTime = Math.round(
							tables.hideout.areas[area].stages[stage].constructionTime / config.HideoutOptions.Faster_Hideout_Construction.Hideout_Construction_Time_Multiplier
						)
					}
				}
			}

			if (config.HideoutOptions.Increased_Fuel_Consumption.enabled) {
				logger.info(`[SPT-Softcore] Increased Fuel Consumption enabled`);
				// 10x faster fuel draw
				tables.hideout.settings.generatorFuelFlowRate *= config.HideoutOptions.Increased_Fuel_Consumption.Fuel_Consumption_Multiplier
			}
		}

		if (config.OtherTweaks.enabled) {
			logger.info(`[SPT-Softcore] OtherTweaks enabled`);
			if (config.OtherTweaks.Skill_Exp_Buffs.enabled) {
				logger.info(`[SPT-Softcore] Skill Exp Buffs enabled`);
				try {
					globals.SkillsSettings.Vitality.DamageTakenAction *= 10
					globals.SkillsSettings.Sniper.WeaponShotAction *= 10
					globals.SkillsSettings.Surgery.SurgeryAction *= 10
					Object.values(globals.SkillsSettings.Immunity).forEach((x) => x * 10)
					Object.values(globals.SkillsSettings.StressResistance).forEach((x) => x * 10)
					Object.values(globals.SkillsSettings.MagDrills).forEach((x) => x * 5)
				} catch (error) {
					logger.warning(`\nOtherTweaks.Skill_Exp_Buffs failed because of another mod. Send bug report. Continue safely.`)
					log(error)
				}
			}

			if (config.OtherTweaks.Allow_Gym_Training_With_Muscle_Pain.enabled) {
				logger.info(`[SPT-Softcore] Allow Gym Training With Muscle Pain enabled`);
				try {
					globals.Health.Effects.SevereMusclePain.GymEffectivity = 0.75
				} catch (error) {
					logger.warning(`\nOtherTweaks.Allow_Gym_Training_With_Muscle_Pain failed because of another mod. Send bug report. Continue safely.`)
					log(error)
				}
			}

			if (config.OtherTweaks.Bigger_Hideout_Containers.enabled) {
				logger.info(`[SPT-Softcore] Bigger Hideout Containers enabled`);
				try {
					tables.templates.items[Items.CONTAINER_MEDICINE]._props.Grids[0]._props.cellsH = 10
					tables.templates.items[Items.CONTAINER_MEDICINE]._props.Grids[0]._props.cellsV = 10

					tables.templates.items[Items.CONTAINER_HOLODILNICK]._props.Grids[0]._props.cellsH = 10
					tables.templates.items[Items.CONTAINER_HOLODILNICK]._props.Grids[0]._props.cellsV = 10

					tables.templates.items[Items.CONTAINER_MAGAZINES]._props.Grids[0]._props.cellsH = 10
					tables.templates.items[Items.CONTAINER_MAGAZINES]._props.Grids[0]._props.cellsV = 7

					tables.templates.items[Items.CONTAINER_ITEMS]._props.Grids[0]._props.cellsH = 10
					tables.templates.items[Items.CONTAINER_ITEMS]._props.Grids[0]._props.cellsV = 10

					tables.templates.items[Items.CONTAINER_WEAPONS]._props.Grids[0]._props.cellsH = 6
					tables.templates.items[Items.CONTAINER_WEAPONS]._props.Grids[0]._props.cellsV = 10
				} catch (error) {
					logger.warning(`\nOtherTweaks.Bigger_Hideout_Containers failed because of another mod. Send bug report. Continue safely.`)
					log(error)
				}
			}

			if (config.OtherTweaks.Remove_Discard_Limit.enabled) {
				logger.info(`[SPT-Softcore] Remove Discard Limit enabled`);
				try {
					for (const i in items) {
						const item = items[i]
						if (item._type == "Item") {
							if (item?._props?.DiscardLimit != undefined) {
								item._props.DiscardLimit = -1
							}
						}
					}
				} catch (error) {
					logger.warning(`\nOtherTweaks.Remove_Discard_Limit failed because of another mod. Send bug report. Continue safely.`)
					log(error)
				}
			}

			if (config.OtherTweaks.Signal_Pistol_In_Special_Slots.enabled) {
				logger.info(`[SPT-Softcore] Signal Pistol In Special Slots enabled`);
				try {
					items[Items.POCKETS_SPECIAL]._props.Slots.forEach((x) => x._props.filters[0].Filter.push(Items.SIGNALPISTOL_SP81))
				} catch (error) {
					logger.warning(`OtherTweaks.Signal_Pistol_In_Special_Slots failed bacause of the other mod. Send bug report. Continue safely.`)
					log(error)
				}
			}

			if (config.OtherTweaks.Unexamined_Items_Are_Back_and_Faster_Examine_Time.enabled) {
				logger.info(`[SPT-Softcore] Unexamined Items Are Back and Faster Examine Time enabled`);
				try {
					for (const itemID in items) {
						const item = items[itemID]
						if (item?._props?.ExaminedByDefault == true) {
							item._props.ExaminedByDefault = false
						}
						if (item?._props?.ExamineTime != undefined) {
							item._props.ExamineTime = 0.2
						}
					}
				} catch (error) {
					logger.warning(`\nOtherTweaks.Unexamined_Items_Are_Back_and_Faster_Examine_Time failed bacause of the other mod. Send bug report. Continue safely.`)
					log(error)
				}
			}

			if (config.OtherTweaks.Remove_Backpack_Restrictions.enabled) {
				logger.info(`[SPT-Softcore] Remove Backpack Restrictions enabled`);
				// Remove backpack restrictions (for containers [ammo, med, etc] mostly).
				// Never again I'll see an unlootable medcase in 314...
				for (const itemID in items) {
					const item = items[itemID]
					if (item._type == "Item" && item._props?.Grids?.length > 0) {
						if (JSON.stringify(item._props.Grids[0]).indexOf("ExcludedFilter") > -1) {
							// JS safety tricks strike again.
							// console.log("Key Found");
							// log(getItemName(item._id))
							let filtered
							try {
								// Safety level 2
								filtered = item._props.Grids[0]._props?.filters[0]?.ExcludedFilter
								if (filtered?.includes(Items.CONTAINER_MEDICINE)) {
									// log(getItemName(item._id))
									item._props.Grids[0]._props.filters[0].ExcludedFilter = []
								}
							} catch (error) {
								logger.warning(
									`\nOtherTweaks.Remove_Backpack_Restrictions failed bacause of the other mod removed default item filter property (like Valens AIO or SVM). Send bug report. Continue safely.`
								)
								// log(error)
							}
						}
					}
				}
			}

			if (config.OtherTweaks.Keytool_Buff.enabled) {
				logger.info(`[SPT-Softcore] Keytool Buff enabled`);
				// Other opinionated tweaks:
				// keytool buff to make it 5x5
				tables.templates.items[Items.CONTAINER_KEY_TOOL]._props.Grids[0]._props.cellsH = 5
				tables.templates.items[Items.CONTAINER_KEY_TOOL]._props.Grids[0]._props.cellsV = 5
			}

			if (config.OtherTweaks.SICC_Case_Buff.enabled) {
				logger.info(`[SPT-Softcore] SICC Case Buff enabled`);
				// Huge buff to SICC case to make it actually not shit and a direct upgrade to Docs. And while we are here, allow it to hold keytool. It's Softcore, who cares.
				try {
					const mergeFilters = [
						...new Set([
							...tables.templates.items[Items.CONTAINER_DOCS]._props.Grids[0]._props.filters[0].Filter,
							...tables.templates.items[Items.CONTAINER_SICC]._props.Grids[0]._props.filters[0].Filter,
							Items.CONTAINER_KEY_TOOL,
						]),
					]
					tables.templates.items[Items.CONTAINER_SICC]._props.Grids[0]._props.filters[0].Filter = mergeFilters
				} catch (error) {
					logger.warning(
						`\nOtherTweaks.SICC_Case_Buff failed bacause of the other mod removed default item filter property (like Valens AIO or SVM). Now SICC case allows all items. Send bug report. Continue safely.`
					)
				} // log(mergeFilters.map((x) => getItemName(x)))
			}

			if (config.OtherTweaks.Reshala_Always_Has_GoldenTT.enabled) {
				logger.info(`[SPT-Softcore] Reshala Always Has GoldenTT enabled`);
				// Reshala always has his Golden TT
				tables.bots.types.bossbully.chances.equipment.Holster = 100
				tables.bots.types.bossbully.inventory.equipment.Holster = {};
				tables.bots.types.bossbully.inventory.equipment.Holster[Items.PISTOL_TT_GOLD] = 1;
			}
		}

		if (config.InsuranceChanges.enabled) {
			logger.info(`[SPT-Softcore] InsuranceChanges enabled`);
			// Redo insurance. Prapor in an instant return with 50% chance, costs 10% of item value, Therapist has 2 hour return with 80% chance, costs 20%.
			try {
				prapor.base.insurance.min_return_hour = 0
				prapor.base.insurance.max_return_hour = 0
				prapor.base.insurance.max_storage_time = 720
				therapist.base.insurance.min_return_hour = 2
				therapist.base.insurance.max_return_hour = 2
				therapist.base.insurance.max_storage_time = 720
				insuranceConfig.insuranceMultiplier[Traders.PRAPOR] = 0.1
				insuranceConfig.insuranceMultiplier[Traders.THERAPIST] = 0.2
				insuranceConfig.returnChancePercent[Traders.PRAPOR] = 50
				insuranceConfig.returnChancePercent[Traders.THERAPIST] = 80
			} catch (error) {
				logger.warning(`\nInsuranceChanges failed because of another mod. Send bug report. Continue safely.`)
				log(error)
			}
		}

		if (config.EconomyOptions.enabled) {
			logger.info(`[SPT-Softcore] EconomyOptions enabled`);
			// Ragfair changes:
			if (config.EconomyOptions.Disable_Flea_Market_Completely.disable) {
				logger.info(`[SPT-Softcore] Disable Flea Market Completely enabled`);
				try {
					globals.RagFair.minUserLevel = 99
				} catch (error) {
					logger.warning(`\nEconomyOptions.Disable_Flea_Market_Completely failed because of another mod. Send bug report. Continue safely.`)
					log(error)
				}
			} else {
				try {
					globals.RagFair.minUserLevel = config.EconomyOptions.Fleamarket_Opened_at_Level.value
				} catch (error) {
					logger.warning(`\nEconomyOptions.Fleamarket_Opened_at_Level failed because of another mod. Send bug report. Continue safely.`)
					log(error)
				}

				try {
					for (const handbookItem in tables.templates.handbook.Items) {
						const itemInHandbook = tables.templates.handbook.Items[handbookItem]
						const itemID = itemInHandbook.Id

						if (prices[itemID] != undefined && config.EconomyOptions.Price_Rebalance.enabled) {
							logger.info(`[SPT-Softcore] Price Rebalance enabled`);
							// Change all Flea prices to handbook prices.
							prices[itemID] = itemInHandbook.Price
						}

						if (
							(!fleaListingsWhitelist.includes(itemInHandbook.ParentId) && config.EconomyOptions.Pacifist_FleaMarket.enabled) ||
							items[itemID]._props.QuestItem
						) {
							logger.info(`[SPT-Softcore] Pacifist FleaMarket enabled`);
							// Ban everything on flea except whitelist handbook categories above.
							ragfairConfig.dynamic.blacklist.custom.push(itemID) // Better semantics then CanSellOnRagfair
							// items[itemID]._props.CanSellOnRagfair = false
						}
					}
				} catch (error) {
					logger.warning(`\nEconomyOptions.Price_Rebalance and Pacifist_FleaMarket failed because of another mod. Send bug report. Continue safely.`)
					log(error)
				}

				try {
					if (config.EconomyOptions.Price_Rebalance.enabled) {
						logger.info(`[SPT-Softcore] Price Rebalance enabled`);
						// Hardcode fix for important or unbalanced items. Too low prices can't convert to barters.
						prices[Items.VISORS_RGLASSES] *= 5 // Round frame sunglasses
						prices[Items.AMMO_40MMRU_VOG25] *= 5 // 40mm VOG-25 grenade
						prices[Items.VISORS_AFGLASS] *= 2 // Anti-fragmentation glasses
						prices[Items.BACKPACK_LK_3F] *= 2 // LolKek 3F Transfer tourist backpack
						prices[Items.FOOD_EMELYA] = 1500 // Emelya
						prices[Items.FOOD_CROUTONS] = 2000 // Croutons
					}
				} catch (error) {
					logger.warning(`\nEconomyOptions.Price_Rebalance failed because of another mod. Send bug report. Continue safely.`)
					log(error)
				}

				try {
					// Unban random spawn only quest keys from flea, make them 2x expensive
					if (config.EconomyOptions.Pacifist_FleaMarket.Enable_QuestKeys.enabled) {
						logger.info(`[SPT-Softcore] Pacifist FleaMarket Enable QuestKeys enabled`);
						for (const questKey of fleaItemsWhiteList.questKeys) {
							prices[questKey] *= config.EconomyOptions.Pacifist_FleaMarket.Enable_QuestKeys.PriceMultiplier
							ragfairConfig.dynamic.blacklist.custom = ragfairConfig.dynamic.blacklist.custom.filter((x) => x != items[questKey]._id) // Better semantics then CanSellOnRagfair
							// items[questKey]._props.CanSellOnRagfair = true
						}
					}
				} catch (error) {
					logger.warning(`\nEconomyOptions.Pacifist_FleaMarket.Enable_QuestKeys failed because of another mod. Send bug report. Continue safely.`)
					log(error)
				}

				try {
					if (config.EconomyOptions.Pacifist_FleaMarket.Enable_Whitelist.enabled) {
						logger.info(`[SPT-Softcore] Pacifist FleaMarket Enable Whitelist enabled`);
						// Unban whitelist
						for (const item of fleaItemsWhiteList.itemWhitelist) {
							ragfairConfig.dynamic.blacklist.custom = ragfairConfig.dynamic.blacklist.custom.filter((x) => x != items[item]._id) // Better semantics then CanSellOnRagfair
							// items[item]._props.CanSellOnRagfair = true
						}
					}
				} catch (error) {
					logger.warning(`\nEconomyOptions.Pacifist_FleaMarket.Enable_Whitelist failed because of another mod. Send bug report. Continue safely.`)
					log(error)
				}

				try {
					if (config.EconomyOptions.Pacifist_FleaMarket.Enable_Marked_Keys.enabled) {
						logger.info(`[SPT-Softcore] Pacifist FleaMarket Enable Marked Keys enabled`);
						// Unban whitelist
						for (const markedKey of fleaItemsWhiteList.markedKeys) {
							prices[markedKey] *= config.EconomyOptions.Pacifist_FleaMarket.Enable_Marked_Keys.PriceMultiplier
							ragfairConfig.dynamic.blacklist.custom = ragfairConfig.dynamic.blacklist.custom.filter((x) => x != items[markedKey]._id) // Better semantics then CanSellOnRagfair
							// items[item]._props.CanSellOnRagfair = true
						}
					}
				} catch (error) {
					logger.warning(`\nEconomyOptions.Pacifist_FleaMarket.Enable_Marked_Keys failed because of another mod. Send bug report. Continue safely.`)
					log(error)
				}

				try {
					if (config.EconomyOptions.Disable_Selling_on_Flea.sellingDisabled == true) {
						ragfairConfig.sell.chance.base = 0
						ragfairConfig.sell.chance.overpriced = 0
						ragfairConfig.sell.chance.underpriced = 0
						// ragfairConfig.sell.time.base = 20
						// ragfairConfig.sell.time.min = 10
						// ragfairConfig.sell.time.max = 30
					} else {
						ragfairConfig.sell.reputation.gain *= 10
						ragfairConfig.sell.reputation.loss *= 10
					}
				} catch (error) {
					logger.warning(`\nEconomyOptions.Disable_Selling_on_Flea failed because of another mod. Send bug report. Continue safely.`)
					log(error)
				}

				try {
					// Sligtly increase flea prices, but with bigger variance, you still get a lot of great trades. Hustle.
					ragfairConfig.dynamic.priceRanges.default.min *= config.EconomyOptions.Flea_Prices_Increased.multiplier // 0.8 -> 1.04
					ragfairConfig.dynamic.priceRanges.default.max *= config.EconomyOptions.Flea_Prices_Increased.multiplier // 1.2 -> 1.56
				} catch (error) {
					logger.warning(`\nSetting ragfairConfig.dynamic.priceRanges.default.min/max failed because of another mod. Send bug report. Continue safely.`)
					log(error)
				}

				try {
					if (config.EconomyOptions.Flea_Pristine_Items.enabled == true) {
						logger.info(`[SPT-Softcore] Flea Pristine Items enabled`);
						// Only pristine items are offered on flea.
						Object.values(ragfairConfig.dynamic.condition).forEach((x) => (x.min = 1)) // ._.
					}
				} catch (error) {
					logger.warning(`\nEconomyOptions.Flea_Pristine_Items failed because of another mod (most likely SVM). Send bug report. Continue safely.`)
					log(error)
				}

				if (config.EconomyOptions.Only_Found_In_Raid_Items_Allowed_For_Barters.enabled == true) {
					logger.info(`[SPT-Softcore] Only Found In Raid Items Allowed For Barters enabled`);
					//Allow FIR only items for barters. This is default, so just in case. To make a point.
					globals.RagFair.isOnlyFoundInRaidAllowed = true
				} else {
					globals.RagFair.isOnlyFoundInRaidAllowed = false
				}

				if (config.EconomyOptions.Barter_Economy.enabled == true) {
					logger.info(`[SPT-Softcore] Barter Economy enabled`);
					try {
						// Can only barter from items not in the blacklist. Only allows base classes, and not itemIDs =(
						// To diable barter requests for individual item, its flea price should be set to 2, like in the code below.
						ragfairConfig.dynamic.barter.itemTypeBlacklist = fleaBarterRequestBlacklist

						ragfairConfig.dynamic.barter.chancePercent = 100 - config.EconomyOptions.Barter_Economy.Cash_Offers_Percentage.value // Allow 10% of listings for cash
						ragfairConfig.dynamic.barter.minRoubleCostToBecomeBarter = 100 // Barters only for items that cost > 100
						ragfairConfig.dynamic.barter.priceRangeVariancePercent = config.EconomyOptions.Barter_Economy.Barter_Price_Variance.value // more variance for flea barters, seems actually fun!

						// Max 2 for 1 barters.
						ragfairConfig.dynamic.barter.itemCountMax = config.EconomyOptions.Barter_Economy.itemCountMax.value

						BSGblacklist.filter((x) => {
							// dirty hack to block BSG blacklisted items (dogtags, bitcoins, ornaments and others) from barters, since you can't buy them on flea anyway, so it should not matter.
							if (x == Items.BARTER_02BTC && config.EconomyOptions.Barter_Economy.Unban_Bitcoins_For_Barters.enabled == true) {
								logger.info(`[SPT-Softcore] Unban Bitcoins For Barters enabled - do nothing`);
								// do nothing
							} else if (!fleaBarterRequestBlacklist.includes(items[x]._parent)) {
								logger.info(`[SPT-Softcore] Unban Bitcoins For Barters disabled`);
								// Only mod items in categories ALLOWED on flea request list
								// Actually, I could have just hardcoded this lol. By default it's just Cristmass ornaments, dogtags and bitcoins.
								// 2 is used to pass getFleaPriceForItem check and not trigger generateStaticPrices
								prices[x] = 2
								// log(`Item ${getItemName(x)}`)
								if (items[x]._props.CanSellOnRagfair == true) {
									logger.warning(
										`\nItem ${getItemName(x)} can be bought on flea for free, don't use BSG blacklist removals with EconomyOptions.Barter_Economy.enabled!`
									)
								}
							}
						})

						// Proper fix for quest items appearing in barter requests
						Object.keys(prices)
							.filter((x) => items[x]?._props?.QuestItem == true)
							.forEach((x) => (prices[x] = 2))

						// Max 20 offers. Too low of a number breaks AKI server for some reason, with constant client errors on completed trades.
						// More random trades variance anyway, this is fun.
						ragfairConfig.dynamic.offerItemCount.min = config.EconomyOptions.Barter_Economy.offerItemCount.min
						ragfairConfig.dynamic.offerItemCount.max = config.EconomyOptions.Barter_Economy.offerItemCount.max

						// Max 2 items per offer. Feels nice. Loot more shit, it might come in handy.
						ragfairConfig.dynamic.nonStackableCount.min = config.EconomyOptions.Barter_Economy.nonStackableCount.min
						ragfairConfig.dynamic.nonStackableCount.max = config.EconomyOptions.Barter_Economy.nonStackableCount.max
					} catch (error) {
						logger.warning(`\nEconomyOptions.Barter_Economy failed because of another mod. Send bug report. Continue safely.`)
						log(error)
					}
				}
			}
		}

		if (config.TraderChanges.enabled) {
			logger.info(`[SPT-Softcore] Trader Changes enabled`);
			if (config.TraderChanges.Better_Sales_To_Traders.enabled) {
				logger.info(`[SPT-Softcore] Better Sales To Traders enabled`);
				if (debug) {
					for (const trader in traderlist) {
						log(`${traderlist[trader].base.nickname}.base.items_buy = {`)
						log(`"category": [`)
						traderlist[trader].base.items_buy.category.forEach((x) => log(`"${x}", // ${getItemName(x)}`))
						log(`],`)
						log(`"id_list": [`)
						traderlist[trader].base.items_buy.id_list.forEach((x) => log(`"${x}", // ${getItemName(x)}`))
						log(`]}`)
					}
				}
				if (debug) {
					for (const trader in traderlist) {
						log(`${traderlist[trader].base.nickname}.base.sell_category = [`)
						traderlist[trader].base.sell_category.forEach((x) => log(`"${x}", // ${locales["en"][x]}`))
						// traderlist[trader].base.sell_category.forEach((x) => log(locales["en"][`${x}`]))
						log(`]`)
					}
					//
					for (const trader in traderlist) {
						log(`${traderlist[trader].base.nickname}: ${100 - traderlist[trader].base.loyaltyLevels[3].buy_price_coef}%`)
					}
				}

				try {
					for (const trader in traderlist) {
						traderlist[trader].base.loyaltyLevels[0].buy_price_coef = 35
						traderlist[trader].base.loyaltyLevels[1].buy_price_coef = 30
						traderlist[trader].base.loyaltyLevels[2].buy_price_coef = 25
						traderlist[trader].base.loyaltyLevels[3].buy_price_coef = 20
					}

					peacekeeper.base.loyaltyLevels.forEach((x) => (x.buy_price_coef += 7))
					skier.base.loyaltyLevels.forEach((x) => (x.buy_price_coef += 6))
					prapor.base.loyaltyLevels.forEach((x) => (x.buy_price_coef += 5))
					mechanic.base.loyaltyLevels.forEach((x) => (x.buy_price_coef += 4))
					jaeger.base.loyaltyLevels.forEach((x) => (x.buy_price_coef += 3))
					ragman.base.loyaltyLevels.forEach((x) => (x.buy_price_coef += 2))
					therapist.base.loyaltyLevels.forEach((x) => (x.buy_price_coef += 1))
				} catch (error) {
					logger.warning(`\nTraderChanges.BetterSalesToTraders failed because of another mod. Send bug report. Continue safely.`)
					log(error)
				}
			}

			if (config.TraderChanges.Alternative_Categories.enabled) {
				logger.info(`[SPT-Softcore] Alternative Categories enabled`);
				try {
					therapist.base.items_buy.category = [
						BaseClasses.MEDS,
						BaseClasses.FOOD_DRINK,
						BaseClasses.MAP,
						BaseClasses.KEY,
						// BaseClasses.BARTER_ITEM,
						BaseClasses.SIMPLE_CONTAINER,
						// new:
						BaseClasses.MEDICAL_SUPPLIES,
						BaseClasses.HOUSEHOLD_GOODS,
					]

					ragman.base.items_buy.category.push(BaseClasses.JEWELRY) // Ragman buys Jewelry and Valuables
					skier.base.items_buy.category.push(BaseClasses.INFO) // Skier buys info items
				} catch (error) {
					logger.warning(`\nTraderChanges.AlternativeCategories failed because of another mod. Send bug report. Continue safely.`)
					log(error)
				}
			}

			if (config.TraderChanges.Skier_Uses_Euros.enabled) {
				logger.info(`[SPT-Softcore] Skier Uses Euros enabled`);
				try {
					// WIP
					skier.base.currency = "EUR"
					skier.base.balance_eur = 700000
					skier.base.loyaltyLevels.forEach((x) => (x.minSalesSum = Math.round(x.minSalesSum / euroPrice)))

					const euroBarterId = skier.assort.items.find((x) => x._tpl == Money.EUROS)._id;

					for (const barter in skier.assort.barter_scheme) {
						if (barter != euroBarterId && skier.assort.barter_scheme[barter][0][0]._tpl == Money.ROUBLES) {
							skier.assort.barter_scheme[barter][0][0].count = roundWithPrecision(skier.assort.barter_scheme[barter][0][0].count / euroPrice, 2)
							skier.assort.barter_scheme[barter][0][0]._tpl = Money.EUROS
						}
					}

					for (const i in tables.templates.quests) {
						const quest = tables.templates.quests[i]
						if (quest.traderId == Traders.SKIER) {
							for (const rewards of quest.rewards.Success) {
								if (rewards.items) {
									for (const item of rewards.items) {
										if (item._tpl == Money.ROUBLES) {
											rewards.value = Math.round(+rewards.value / euroPrice)
											item._tpl = Money.EUROS
											item.upd.StackObjectsCount = Math.round(item.upd.StackObjectsCount / euroPrice)
										}
									}
								}
							}
						}
					}
				} catch (error) {
					logger.warning(`\nTraderChanges.SkierUsesEuros failed because of another mod. Send bug report. Continue safely.`)
					log(error)
				}
			}

			if (config.TraderChanges.Reasonably_Priced_Cases.enabled == true) {
				logger.info(`[SPT-Softcore] Reasonably Priced Cases enabled`);
				try {
					getBarterSchemeByItemAndCurrency(therapist, Items.CONTAINER_THICC_ITEM_CASE, Items.BARTER_LEDX)
						?.forEach((x) => (x.count = 5));

					getBarterSchemeByItemAndCurrency(therapist, Items.CONTAINER_THICC_ITEM_CASE, Items.DRINK_MOONSHINE)
						?.forEach((x) => (x.count = 10))

					getBarterSchemeByItemAndCurrency(therapist, Items.CONTAINER_ITEMS, Money.EUROS)
						?.forEach((x) => (x.count = 7256))

					getBarterSchemeByItemAndCurrency(therapist, Items.CONTAINER_ITEMS, Items.BARTER_OSCOPE)
						?.forEach((x) => (x.count = 8))

					getBarterSchemeByItemAndCurrency(therapist, Items.CONTAINER_ITEMS, Items.BARTER_USEC)
						?.forEach((x) => (x.count = 20))

					getBarterSchemeByItemAndCurrency(therapist, Items.CONTAINER_JUNK, Items.BARTER_USEC)
						?.forEach((x) => (x.count = 15))

					getBarterSchemeByItemAndCurrency(therapist, Items.CONTAINER_JUNK, Money.ROUBLES)
						?.forEach((x) => (x.count = 961138))

					getBarterSchemeByItemAndCurrency(therapist, Items.CONTAINER_MEDICINE, Money.ROUBLES)
						?.forEach((x) => (x.count = 290610))

					getBarterSchemeByItemAndCurrency(therapist, Items.BARTER_LEDX, Items.BARTER_USEC)
						?.forEach((x) => (x.count /= 10)) // Really BSG? 160 kills for a non-FIR item? REALLY?!

					// Commented out for now, as this barter is missing from 3.7.0
					// getBarterSchemeByItemAndCurrency(peacekeeper, Items.CONTAINER_THICC_ITEM_CASE, Items.INFO_BLUE_FOLDERS)
					// 	?.forEach((x) => (x.count = x.count / 5 + 1))

					getBarterSchemeByItemAndCurrency(skier, Items.CONTAINER_WEAPONS, Items.DRINK_MOONSHINE)
						?.forEach((x) => (x.count = 4))

					getBarterSchemeByItemAndCurrency(mechanic, Items.CONTAINER_WEAPONS, Items.BARTER_02BTC)
						?.forEach((x) => (x.count = 5))

					getBarterSchemeByItemAndCurrency(mechanic, Items.CONTAINER_THICC_WEAPON_CASE, Items.BARTER_02BTC)
						?.forEach((x) => (x.count = 10))
				} catch (error) {
					logger.warning(`\nTraderChanges.Reasonably_Priced_Cases failed because of another mod. Send bug report. Continue safely.`)
					log(error)
				}
			}

			if (config.TraderChanges.Pacifist_Fence.enabled == true) {
				logger.info(`[SPT-Softcore] Pacifist Fence enabled`);
				try {
					// Add BSGblacklist and mod custom blacklist to Fence blacklists
					let fenceBlacklist = []

					// In addition to other blacklists, no medikits, medical items and drugs for Fence, because he sells them not in pristine condition.
					fenceBlacklist.push(
						...BSGblacklist,
						...fleaBarterRequestBlacklist,
						BaseClasses.MEDKIT,
						BaseClasses.MEDICAL,
						BaseClasses.DRUGS
					)

					// Instead, allow him to sell stims!
					fenceBlacklist = fenceBlacklist.filter((x) => x != BaseClasses.STIMULATOR)

					// Fence sells only items that are not in the flea blacklist
					traderConfig.fence.assortSize = config.TraderChanges.Pacifist_Fence.Number_Of_Fence_Offers
					traderConfig.fence.blacklist = fenceBlacklist //itemid or baseid
					traderConfig.fence.maxPresetsPercent = 0
					traderConfig.fence.discountOptions.assortSize = config.TraderChanges.Pacifist_Fence.Number_Of_Fence_Offers * 2
					traderConfig.fence.itemPriceMult = 1
					traderConfig.fence.discountOptions.itemPriceMult = 0.82 // This Fence settings are weird. I still don't get how AKI calculates assorts, was getting very strange results in testing. But this should be close enough to best trader prices but not abusable.
				} catch (error) {
					logger.warning(`\nTraderChanges.Pacifist_Fence failed because of another mod. Send bug report. Continue safely.`)
					log(error)
				}
			}
		}

		if (config.CraftingRebalance.enabled == true) {
			logger.info(`[SPT-Softcore] Crafting Rebalance enabled`);
			// Crafts:
			// This here, is some dumb stuff, I should've created some special class, controller, pushed the data out of the code or some other OOP bullcrap, but I'm not a programmer, so this will have to suffice. Sorry, not sorry.

			try {
				// ------
				// Lavatory:
				// ------
				// Toilet paper production nerf lol. Who would have thought this craft would be OP, huh?
				getCraft(Items.BARTER_TP).count = 1

				// 2x Clin production buff
				getCraft(Items.BARTER_CLIN).count = 2

				// 2x Paracord production buff
				getCraft(Items.BARTER_PARACORD).count = 2

				// Corrugated hose buff
				getCraft(Items.BARTER_HOSE).requirements.forEach((x) => {
					if (x.count) {
						x.count = 1
					}
				})
				getCraft(Items.BARTER_HOSE).count = 1

				// Water filter < 2 airfilter craft buff
				getCraft(Items.BARTER_WFILTER).requirements.find((x) => x.templateId == Items.BARTER_FILTER).count = 2

				// MPPV buff (KEKTAPE duct tape 2 -> 1)
				getCraft(Items.VEST_MPPV).requirements.find((x) => x.templateId == Items.BARTER_KEK).count = 1

				// ------
				// Nutrition unit:
				// ------

				// EWR buff
				getCraft(Items.DRINK_EWR).count = 3

				// coffee buff (2 -> 3)
				getCraft(Items.BARTER_MAJAICA).count = 3

				// bottled water buff water (8 -> 16)
				getCraft(Items.DRINK_WATER).count = 16

				// Aquamari buff (3 -> 5)
				getCraft(Items.DRINK_AQUAMARI).count = 5

				// ------
				// Medstation:
				// ------

				// Buff MULE
				getCraft(Items.STIM_MULE).count = 2

				// AFAK buff
				getCraft(Items.MEDKIT_AFAK).requirements.find((x) => x.templateId == Items.MEDKIT_IFAK).count = 1
				getCraft(Items.MEDKIT_AFAK).requirements.find((x) => x.templateId == Items.MEDICAL_ARMY_BANDAGE).templateId = Items.MEDICAL_CALOKB

				// Portable defibrillator big nerf (Portable Powerbank 1 -> 4). Lore-friendly and still profitable, just not as ridiculous.
				getCraft(Items.BARTER_DEFIBRILLATOR).requirements.find((x) => x.templateId == Items.BARTER_POWERBANK).count = 4

				// LEDX buff (Huge buff, 1 of each component only). Now it is actually only sometimes bother to craft it.
				getCraft(Items.BARTER_LEDX).requirements.forEach((x) => {
					if (x.count) {
						x.count = 1
					}
				})

				// CMS nerf (Medical tools 1 -> 2)
				getCraft(Items.MEDICAL_CMS).requirements.find((x) => x.templateId == Items.BARTER_MEDTOOLS).count = 2

				// GRIzZLY nerf (1 -> 2)
				getCraft(Items.MEDKIT_GRIZZLY).count = 1

				// SJ6 buff (2 -> 3)
				getCraft(Items.STIM_SJ6).count = 3

				// ------
				// Intel Center:
				// ------

				// Topographic survey maps buff (1 -> 2)
				getCraft(Items.INFO_MAPS).count = 2

				// Military flash drive lore-based change (2 Secure Flash drive -> 1 VPX, and Topographic survey maps 2 -> 1).
				// Not "profitable", but will change Intel folder craft to compensate, and allow it to be crafted on level 2.
				getCraft(Items.INFO_MFD).requirements.forEach((x) => {
					if (x.count) {
						x.count = 1
					}
				})
				getCraft(Items.INFO_MFD).requirements.find((x) => x.type == "Area").requiredLevel = 2
				getCraft(Items.INFO_MFD).requirements.find((x) => x.templateId == Items.INFO_FLASH_DRIVE).templateId = Items.BARTER_VPX

				// Intelligence folder buff (Military flash drive 2 -> 1)
				getCraft(Items.INFO_INTELLIGENCE).requirements.find((x) => x.templateId == Items.INFO_MFD).count = 1

				// VPX buff (RAM and Broken GPhone smartphone 3 -> 2)
				getCraft(Items.BARTER_VPX).requirements.forEach((x) => {
					if (x.count) {
						x.count = 2
					}
				})

				// Virtex buff (Military circuit board 2 -> 1)
				getCraft(Items.BARTER_VIRTEX).requirements.find((x) => x.templateId == Items.BARTER_MCB).count = 1

				// ------
				// Workbench:
				// ------

				// Military circuit board buff (1 -> 2)
				getCraft(Items.BARTER_MCB).count = 2

				// FLIR huge buff (everything is 1, plus change SAS drive (wtf?!) to Armasight Vulcan MG 3.5x Bravo night vision scope)
				getCraft(Items.SPECIALSCOPE_FLIR_RS32).requirements.forEach((x) => {
					if (x.count) {
						x.count = 1
					}
				})
				getCraft(Items.SPECIALSCOPE_FLIR_RS32).requirements.find((x) => x.templateId == Items.INFO_SAS).templateId = Items.SPECIALSCOPE_VULCAN_MG_35X

				// GPU buff (3 VPX -> 1 Virtex, 10 PCB -> 1, 10 CPU -> 1)
				getCraft(Items.BARTER_GPU).requirements.find((x) => x.templateId == Items.BARTER_VPX).count = 1
				getCraft(Items.BARTER_GPU).requirements.find((x) => x.templateId == Items.BARTER_VPX).templateId = Items.BARTER_VIRTEX
				getCraft(Items.BARTER_GPU).requirements.find((x) => x.templateId == Items.BARTER_CPU).count = 1
				getCraft(Items.BARTER_GPU).requirements.find((x) => x.templateId == Items.BARTER_PCB).count = 1

				// UHF RFID Reader huge buff (only Broken GPhone X smartphone + Signal Jammer)
				getCraft(Items.BARTER_RFIDR).requirements = [
					{
						areaType: HideoutAreas.INTEL_CENTER,
						requiredLevel: 2,
						type: "Area",
					},
					{
						templateId: Items.BARTER_GPX,
						count: 1,
						isFunctional: false,
						type: "Item",
					},
					{
						templateId: Items.SPECITEM_JAMMER,
						count: 1,
						isFunctional: false,
						type: "Item",
					},
					{
						templateId: Items.BARTER_LF_SCDR,
						type: "Tool",
					},
					{
						templateId: Items.BARTER_F_SCDR,
						type: "Tool",
					},
				]

				// Gasan buff
				getCraft(Items.BARTER_GASAN).requirements.forEach((x) => {
					if (x.count) {
						x.count = 1
					}
				})

				// Hawk nerf
				const hawkCraft = getCraftByOutputAndInput(Items.BARTER_HAWK, Items.BARTER_MATCHES);
				if (hawkCraft) {
					hawkCraft.requirements.find((x) => x.templateId == Items.BARTER_MATCHES).templateId = Items.BARTER_THERMITE
					hawkCraft.requirements.find((x) => x.type == "Area").requiredLevel = 2
				}

				// Spark plug buff 1 -> 4
				getCraft(Items.BARTER_SPLUG).count = 4

				// PCB -> counter instead of gasan, 3 PCB
				const pcbCraft = getCraftByOutputAndInput(Items.BARTER_PCB, Items.BARTER_GASAN);
				if (pcbCraft) {
					pcbCraft.count = 3
					pcbCraft.requirements.find((x) => x.templateId == Items.BARTER_GASAN).templateId = Items.BARTER_GMCOUNT
				}

				// Geiger-Muller counter uses only 1 gasan at lvl1
				getCraft(Items.BARTER_GMCOUNT).requirements = [
					{
						areaType: HideoutAreas.WORKBENCH,
						requiredLevel: 1,
						type: "Area",
					},
					{
						templateId: Items.BARTER_GASAN,
						count: 1,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
					{
						templateId: Items.BARTER_TOOLSET,
						type: "Tool",
					},
				]

				// GreenBat
				getCraft(Items.BARTER_GREENBAT).count = 2
				getCraft(Items.BARTER_GREENBAT).requirements = [
					{
						areaType: HideoutAreas.WORKBENCH,
						requiredLevel: 2,
						type: "Area",
					},
					{
						templateId: Items.BARTER_POWERBANK,
						count: 1,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
					{
						templateId: Items.BARTER_RPLIERS,
						type: "Tool",
					},
				]

				// VOG-25 Khattabka improvised hand grenade
				getCraft(Items.GRENADE_VOG25).requirements.forEach((x) => {
					if (x.count) {
						x.count = 2
					}
				})

				// 23x75mm "Zvezda" flashbang round
				getCraft(Items.AMMO_23X75_ZVEZDA).count = 20
				getCraft(Items.AMMO_23X75_ZVEZDA).requirements = [
					{
						areaType: HideoutAreas.WORKBENCH,
						requiredLevel: 2,
						type: "Area",
					},
					{
						templateId: Items.BARTER_EAGLE,
						count: 1,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
					{
						templateId: Items.AMMO_23X75_SHRAP10,
						count: 20,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
					{
						templateId: Items.GRENADE_ZARYA,
						count: 2,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
					{
						templateId: Items.BARTER_TOOLSET,
						type: "Tool",
					},
					{
						templateId: Items.SPECITEM_MULTITOOL,
						type: "Tool",
					},
				]

				// Rechargeable battery buff, Portable Powerbank -> Electric drill
				getCraft(Items.BARTER_RBATTERY).requirements.find((x) => x.templateId == Items.BARTER_POWERBANK).templateId = Items.BARTER_DRILL

				//// AMMO ////
				// 9x19mm AP 6.3
				getCraft(Items.AMMO_9X19_AP_63).requirements.find((x) => x.templateId == Items.BARTER_HAWK).count = 1
				getCraft(Items.AMMO_9X19_AP_63).requirements.find((x) => x.templateId == Items.BARTER_HAWK).templateId = Items.BARTER_EAGLE

				// 9x19mm PBP gzh
				getCraft(Items.AMMO_9X19_PBP).requirements = [
					{
						areaType: HideoutAreas.WORKBENCH,
						requiredLevel: 3,
						type: "Area",
					},
					{
						templateId: Items.AMMO_9X19_AP_63,
						count: 200,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
					{
						templateId: Items.BARTER_HAWK,
						count: 1,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
					{
						templateId: Items.BARTER_TOOLSET,
						type: "Tool",
					},
				]

				// .45 ACP AP buff
				getCraft(Items.AMMO_45ACP_AP).count = 120
				getCraft(Items.AMMO_45ACP_AP).requirements = [
					{
						areaType: HideoutAreas.WORKBENCH,
						requiredLevel: 2,
						type: "Area",
					},
					{
						templateId: Items.AMMO_45ACP_LASERMATCH,
						count: 120,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
					{
						templateId: Items.SPECITEM_MULTITOOL,
						type: "Tool",
					},
					{
						templateId: Items.BARTER_EAGLE,
						count: 1,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
					{
						templateId: Items.BARTER_NAILS,
						count: 1,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
					{
						templateId: Items.BARTER_MASTER,
						type: "Tool",
					},
				]

				// 5.7x28mm SS190 buff
				getCraft(Items.AMMO_57X28_SS190).requirements = [
					{
						areaType: HideoutAreas.WORKBENCH,
						requiredLevel: 2,
						type: "Area",
					},
					{
						templateId: Items.BARTER_HAND_DRILL,
						type: "Tool",
					},
					{
						templateId: Items.BARTER_ELITE,
						type: "Tool",
					},
					{
						templateId: Items.AMMO_57X28_SS197SR,
						count: 180,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
					{
						templateId: Items.BARTER_HAWK,
						count: 1,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
					{
						templateId: Items.BARTER_NAILS,
						count: 2,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
				]

				// 7.62x51mm M80 buff
				getCraft(Items.AMMO_762X51_M80).requirements = [
					{
						areaType: HideoutAreas.WORKBENCH,
						requiredLevel: 3,
						type: "Area",
					},
					{
						templateId: Items.SPECITEM_MULTITOOL,
						type: "Tool",
					},
					{
						templateId: Items.BARTER_RPLIERS,
						type: "Tool",
					},
					{
						templateId: Items.AMMO_762X51_BCP_FMJ,
						count: 80,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
					{
						templateId: Items.BARTER_EAGLE,
						count: 2,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
				]

				// 5.56x45mm MK 318 Mod 0 (SOST)
				getCraft(Items.AMMO_556X45_SOST).requirements = [
					{
						areaType: HideoutAreas.WORKBENCH,
						requiredLevel: 2,
						type: "Area",
					},
					{
						templateId: Items.AMMO_556X45_HP,
						count: 150,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
					{
						templateId: Items.BARTER_EAGLE,
						count: 1,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
					{
						templateId: Items.BARTER_ELITE,
						type: "Tool",
					},
				]

				// Commented out for now, as doesn't exist in 3.7.0
				// 7.62x39mm BP gzh
				// getCraft(Items.AMMO_762X39_BP).requirements = [
				// 	{
				// 		areaType: HideoutAreas.WORKBENCH,
				// 		requiredLevel: 3,
				// 		type: "Area",
				// 	},
				// 	{
				// 		templateId: Items.AMMO_762X39_PS,
				// 		count: 120,
				// 		isFunctional: false,
				// 		isEncoded: false,
				// 		type: "Item",
				// 	},
				// 	{
				// 		templateId: Items.AMMO_762X39_US,
				// 		count: 120,
				// 		isFunctional: false,
				// 		isEncoded: false,
				// 		type: "Item",
				// 	},
				// 	{
				// 		templateId: Items.BARTER_HAWK,
				// 		count: 1,
				// 		isFunctional: false,
				// 		isEncoded: false,
				// 		type: "Item",
				// 	},
				// 	{
				// 		templateId: Items.SPECITEM_MULTITOOL,
				// 		type: "Tool",
				// 	},
				// ]

				// 9x19mm RIP
				getCraft(Items.AMMO_9X19_RIP).requirements = [
					{
						areaType: HideoutAreas.WORKBENCH,
						requiredLevel: 2,
						type: "Area",
					},
					{
						templateId: Items.AMMO_9X19_PST,
						count: 180,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
					{
						templateId: Items.KNIFE_A2607,
						count: 2,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
					{
						templateId: Items.BARTER_ELITE,
						type: "Tool",
					},
					{
						templateId: Items.BARTER_SLEDGEHAMMER,
						type: "Tool",
					},
				]

				// 5.45x39mm PPBS gs "Igolnik"
				getCraft(Items.AMMO_545X39_PPBS).count = 120
				getCraft(Items.AMMO_545X39_PPBS).requirements = [
					{
						areaType: HideoutAreas.WORKBENCH,
						requiredLevel: 3,
						type: "Area",
					},
					{
						templateId: Items.BARTER_KITE,
						count: 1,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
					{
						templateId: Items.BARTER_EAGLE,
						count: 1,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
					{
						templateId: Items.BARTER_HAWK,
						count: 1,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
					{
						templateId: Items.AMMO_545X39_PP,
						count: 120,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
					{
						templateId: Items.AMMO_545X39_BP,
						count: 120,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
					{
						templateId: Items.BARTER_NIPPERS,
						type: "Tool",
					},
					{
						templateId: Items.BARTER_PLIERS,
						type: "Tool",
					},
				]

				// 12.7x55mm PS12B
				getCraft(Items.AMMO_127X55_PS12B).count = 120

				// 5.56x45mm M995
				getCraft(Items.AMMO_556X45_M995).count = 180
				getCraft(Items.AMMO_556X45_M995).requirements = [
					{
						areaType: HideoutAreas.WORKBENCH,
						requiredLevel: 3,
						type: "Area",
					},
					{
						templateId: Items.BARTER_HAWK,
						count: 1,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
					{
						templateId: Items.AMMO_556X45_M855A1,
						count: 180,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
					{
						templateId: Items.BARTER_TOOLSET,
						type: "Tool",
					},
					{
						templateId: Items.SPECITEM_MULTITOOL,
						type: "Tool",
					},
				]

				// Commented out for now, as doesn't exist in 3.7.0
				// 9x39mm SP-6 gs
				// getCraft(Items.AMMO_9X39_SP6).requirements = [
				// 	{
				// 		templateId: Items.AMMO_762X39_US,
				// 		count: 300,
				// 		isFunctional: false,
				// 		isEncoded: false,
				// 		type: "Item",
				// 	},
				// 	{
				// 		templateId: Items.AMMO_9X19_PST,
				// 		count: 300,
				// 		isFunctional: false,
				// 		isEncoded: false,
				// 		type: "Item",
				// 	},
				// 	{
				// 		templateId: Items.BARTER_HAWK,
				// 		count: 3,
				// 		isFunctional: false,
				// 		isEncoded: false,
				// 		type: "Item",
				// 	},
				// 	{
				// 		areaType: HideoutAreas.WORKBENCH,
				// 		requiredLevel: 2,
				// 		type: "Area",
				// 	},
				// 	{
				// 		templateId: Items.BARTER_TOOLSET,
				// 		type: "Tool",
				// 	},
				// ]

				// 9x39mm SPP gs
				getCraft(Items.AMMO_9X39_SPP).requirements = [
					{
						areaType: HideoutAreas.WORKBENCH,
						requiredLevel: 3,
						type: "Area",
					},
					{
						templateId: Items.AMMO_9X39_SP5,
						count: 200,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
					{
						templateId: Items.AMMO_9X19_PBP,
						count: 200,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
					{
						templateId: Items.BARTER_NIPPERS,
						type: "Tool",
					},
				]

				// 7.62x54mm R SNB gzh nerf lol
				getCraft(Items.AMMO_762X54R_SNB).requirements.find((x) => x.templateId == Items.AMMO_762X54R_LPS).templateId = Items.AMMO_762X54R_BT
				getCraft(Items.AMMO_762X54R_SNB).requirements.find((x) => x.type == "Area").requiredLevel = 3

				// 9x21mm BT gzh buff
				getCraft(Items.AMMO_9X21_BT)
					.requirements.filter((x) => x.templateId != Items.AMMO_9X21_PS && x.areaType == undefined)
					.forEach((x) => (x.count = 1))

				// 9x18mm PMM PstM gzh
				getCraft(Items.AMMO_9X18PM_PSTM).requirements.push({
					templateId: Items.AMMO_9X18PM_PST,
					count: 140,
					isFunctional: false,
					isEncoded: false,
					type: "Item",
				})

				// 12/70 8.5mm Magnum buckshot
				getCraft(Items.AMMO_12G_MAGNUM).requirements = [
					{
						areaType: HideoutAreas.WORKBENCH,
						requiredLevel: 1,
						type: "Area",
					},
					{
						templateId: Items.AMMO_12G_7MM,
						count: 120,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
					{
						templateId: Items.BARTER_KITE,
						count: 1,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
				]

				// Commented out for now, as doesn't exist in 3.7.0
				// 12/70 flechette
				// getCraft(Items.AMMO_12G_FLECHETTE).requirements = [
				// 	{
				// 		areaType: HideoutAreas.WORKBENCH,
				// 		requiredLevel: 1,
				// 		type: "Area",
				// 	},
				// 	{
				// 		templateId: Items.BARTER_METAL_TANK,
				// 		count: 1,
				// 		isFunctional: false,
				// 		isEncoded: false,
				// 		type: "Item",
				// 	},
				// 	{
				// 		templateId: Items.BARTER_KITE,
				// 		count: 1,
				// 		isFunctional: false,
				// 		isEncoded: false,
				// 		type: "Item",
				// 	},
				// 	{
				// 		templateId: Items.AMMO_12G_GRIZZLY_40,
				// 		count: 60,
				// 		isFunctional: false,
				// 		isEncoded: false,
				// 		type: "Item",
				// 	},
				// 	{
				// 		templateId: Items.BARTER_MSCISSORS,
				// 		type: "Tool",
				// 	},
				// 	{
				// 		templateId: Items.SPECITEM_MULTITOOL,
				// 		type: "Tool",
				// 	},
				// ]

				// 12/70 RIP
				getCraft(Items.AMMO_12G_RIP).requirements.push({
					templateId: Items.AMMO_12G_DUALSABOT,
					count: 60,
					isFunctional: false,
					isEncoded: false,
					type: "Item",
				})

				// 12/70 AP-20 armor-piercing slug
				getCraft(Items.AMMO_12G_AP20).requirements = [
					{
						areaType: HideoutAreas.WORKBENCH,
						requiredLevel: 2,
						type: "Area",
					},
					{
						templateId: Items.AMMO_12G_MAGNUM,
						count: 80,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
					{
						templateId: Items.AMMO_9X19_AP_63,
						count: 80,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
					{
						templateId: Items.BARTER_NIPPERS,
						type: "Tool",
					},
					{
						templateId: Items.BARTER_LF_SCDR,
						type: "Tool",
					},
				]

				// 5.56x45mm M856A1 buff
				getCraft(Items.AMMO_556X45_M856A1).requirements.find((x) => x.templateId == Items.BARTER_HAWK).count = 1

				// 4.6x30mm AP SX
				getCraft(Items.AMMO_46X30_AP_SX).requirements.forEach((x) => {
					if (x.count && x.count < 10) {
						x.count = 1
					}
				})

				// Commented out for now, as doesn't exist in 3.7.0
				// .300 Blackout AP
				// getCraft(Items.AMMO_762X35_AP).requirements = [
				// 	{
				// 		areaType: HideoutAreas.WORKBENCH,
				// 		requiredLevel: 3,
				// 		type: "Area",
				// 	},
				// 	{
				// 		templateId: Items.BARTER_MASTER,
				// 		type: "Tool",
				// 	},
				// 	{
				// 		templateId: Items.BARTER_NIPPERS,
				// 		type: "Tool",
				// 	},
				// 	{
				// 		templateId: Items.AMMO_762X35_WHISPER,
				// 		count: 120,
				// 		isFunctional: false,
				// 		isEncoded: false,
				// 		type: "Item",
				// 	},
				// 	{
				// 		templateId: Items.AMMO_762X51_M61,
				// 		count: 120,
				// 		isFunctional: false,
				// 		isEncoded: false,
				// 		type: "Item",
				// 	},
				// ]

				// .366 TKM AP-M change
				getCraft(Items.AMMO_366TKM_APM).requirements = [
					{
						areaType: HideoutAreas.WORKBENCH,
						requiredLevel: 2,
						type: "Area",
					},
					{
						templateId: Items.AMMO_9X39_SP6,
						count: 100,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
					{
						templateId: Items.AMMO_762X39_HP,
						count: 100,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
					{
						templateId: Items.BARTER_PLIERS,
						type: "Tool",
					},
				]
				// 7.62x51mm M61 buff
				getCraft(Items.AMMO_762X51_M61).requirements = [
					{
						areaType: HideoutAreas.WORKBENCH,
						requiredLevel: 3,
						type: "Area",
					},
					{
						templateId: Items.BARTER_HAWK,
						count: 2,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
					{
						templateId: Items.BARTER_HELIX,
						count: 1,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
					{
						templateId: Items.AMMO_762X51_M62,
						count: 80,
						isFunctional: false,
						isEncoded: false,
						type: "Item",
					},
					{
						templateId: Items.SPECITEM_MULTITOOL,
						type: "Tool",
					},
				]
				getCraft(Items.AMMO_762X51_M61).count = 80

				// 5.45x39mm PP gs nerf
				getCraft(Items.AMMO_545X39_PP).count = 200
				getCraft(Items.AMMO_545X39_PP).requirements.find((x) => x.templateId == Items.BARTER_BOLTS).count = 200
				getCraft(Items.AMMO_545X39_PP).requirements.find((x) => x.templateId == Items.BARTER_BOLTS).templateId = Items.AMMO_545X39_US

				// OFZ 30x160mm shell
				getCraft(Items.BARTER_OFZ).requirements.forEach((x) => {
					if (x.count) {
						x.count = 1
					}
				})

				// RGD-5 hand grenade
				getCraft(Items.GRENADE_RGD5).requirements.forEach((x) => {
					if (x.count) {
						x.count = 1
					}
				})

				// "Zarya" stun grenade buff
				getCraft(Items.GRENADE_ZARYA).requirements.forEach((x) => {
					if (x.count) {
						x.count = 1
					}
				})

				// */
			} catch (error) {
				logger.warning(`\nCraftingRebalance failed because of another mod. Send bug report. Continue safely.`)
				log(error)
			}
		}

		if (config.AdditionalCraftingRecipes.enabled == true) {
			logger.info(`\nAdditionalCraftingRecipes enabled. Adding recipes...`)
			try {
				// 63da4dbee8fa73e225000001
				// 63da4dbee8fa73e225000002
				// 63da4dbee8fa73e225000003
				// 63da4dbee8fa73e225000004
				// 63da4dbee8fa73e225000005
				// 63da4dbee8fa73e225000006
				// 63da4dbee8fa73e225000007
				// 63da4dbee8fa73e225000008
				// 63da4dbee8fa73e225000009
				// 63da4dbee8fa73e22500000a

				const ophthalmoscope: IHideoutProduction = {
					_id: "63da4dbee8fa73e225000001",

					areaType: HideoutAreas.MEDSTATION,
					requirements: [
						{
							areaType: HideoutAreas.MEDSTATION,
							requiredLevel: 3,
							type: "Area"
						},
						{
							templateId: Items.BARTER_GREENBAT,
							count: 1,
							isFunctional: false,
							type: "Item",
						},
						{
							templateId: Items.BARTER_MEDTOOLS,
							count: 2,
							isFunctional: false,
							type: "Item",
						},
						{
							templateId: Items.FLASHLIGHT_WF501B,
							count: 1,
							isFunctional: false,
							type: "Item",
						},
						{
							templateId: Items.SPECITEM_CAMERA,
							count: 1,
							isFunctional: false,
							type: "Item",
						},
						{
							templateId: Items.BARTER_DUCT_TAPE,
							count: 1,
							isFunctional: false,
							type: "Item",
						},
					],
					productionTime: 105,
					endProduct: Items.BARTER_OSCOPE,
					continuous: false,
					count: 1,
					productionLimitCount: 0,
					isEncoded: false,
					locked: false,
					needFuelForAllProductionTime: false
				}
				const zagustin: IHideoutProduction = {
					_id: "63da4dbee8fa73e225000002",

					areaType: HideoutAreas.MEDSTATION,
					requirements: [
						{
							areaType: HideoutAreas.MEDSTATION,
							requiredLevel: 3,
							type: "Area"
						},
						{
							templateId: Items.STIM_PROPITAL,
							count: 2,
							isFunctional: false,
							type: "Item",
						},
						{
							templateId: Items.MEDICAL_CALOKB,
							count: 1,
							isFunctional: false,
							type: "Item",
						},
						{
							templateId: Items.STIM_AHF1M,
							count: 1,
							isFunctional: false,
							type: "Item",
						},
					],
					productionTime: 105,
					endProduct: Items.STIM_ZAGUSTIN,
					continuous: false,
					count: 3,
					productionLimitCount: 0,
					isEncoded: false,
					locked: false,
					needFuelForAllProductionTime: false
				}
				const obdolbos: IHideoutProduction = {
					// Did you always want to run your own meth lab in Tarkov? Now you can.
					_id: "63da4dbee8fa73e225000003",

					areaType: HideoutAreas.MEDSTATION,
					requirements: [
						{
							areaType: HideoutAreas.MEDSTATION,
							requiredLevel: 3,
							type: "Area"
						},
						{
							templateId: Items.STIM_SJ1,
							count: 1,
							isFunctional: false,
							type: "Item",
						},
						{
							templateId: Items.BARTER_FCOND,
							count: 1,
							isFunctional: false,
							type: "Item",
						},
						{
							templateId: Items.BARTER_DCLEANER,
							count: 1,
							isFunctional: false,
							type: "Item",
						},
						{
							templateId: Items.DRINK_PEVKO,
							count: 1,
							isFunctional: false,
							type: "Item",
						},
						{
							templateId: Items.DRINK_VODKA,
							count: 1,
							isFunctional: false,
							type: "Item",
						},
						{
							templateId: Items.DRINK_WHISKEY,
							count: 1,
							isFunctional: false,
							type: "Item",
						},
						{
							templateId: Items.DRINK_MOONSHINE,
							count: 1,
							isFunctional: false,
							type: "Item",
						},
						{
							templateId: Items.BARTER_FP100,
							type: "Tool",
						},
					],
					productionTime: 564,
					endProduct: Items.STIM_OBDOLBOS,
					continuous: false,
					count: 8,
					productionLimitCount: 0,
					isEncoded: false,
					locked: false,
					needFuelForAllProductionTime: false
				}
				const calok: IHideoutProduction = {
					_id: "63da4dbee8fa73e225000004",

					areaType: HideoutAreas.MEDSTATION,
					requirements: [
						{
							areaType: HideoutAreas.MEDSTATION,
							requiredLevel: 2,
							type: "Area"
						},
						{
							templateId: Items.BARTER_SODIUM, // Pack of sodium bicarbonate
							count: 1,
							isFunctional: false,
							type: "Item",
						},
						{
							templateId: Items.DRUGS_VASELINE, // Vaseline balm
							count: 1,
							isFunctional: false,
							type: "Item",
						},
					],
					productionTime: 48,
					endProduct: Items.MEDICAL_CALOKB,
					continuous: false,
					count: 2,
					productionLimitCount: 0,
					isEncoded: false,
					locked: false,
					needFuelForAllProductionTime: false
					// Granular nature? Check.
					// Stops blood with magical properties of pain-relieving Tarkov Vaseline? Check.
					// Fun and economically balanced recipe that includes underused items? Triple check.
				}
				const adrenaline: IHideoutProduction = {
					_id: "63da4dbee8fa73e225000005",

					areaType: HideoutAreas.MEDSTATION,
					requirements: [
						{
							areaType: HideoutAreas.MEDSTATION,
							requiredLevel: 2,
							type: "Area"
						},
						{
							templateId: Items.DRINK_HOT_ROD,
							count: 3,
							isFunctional: false,
							type: "Item",
						},
						{
							templateId: Items.MEDKIT_AI2,
							count: 1,
							isFunctional: false,
							type: "Item",
						},
					],
					productionTime: 23,
					endProduct: Items.STIM_ADRENALINE,
					continuous: false,
					count: 1,
					productionLimitCount: 0,
					isEncoded: false,
					locked: false,
					needFuelForAllProductionTime: false
				}
				const threebTG: IHideoutProduction = {
					_id: "63da4dbee8fa73e225000006",

					areaType: HideoutAreas.MEDSTATION,
					requirements: [
						{
							areaType: HideoutAreas.MEDSTATION,
							requiredLevel: 3,
							type: "Area"
						},
						{
							templateId: Items.STIM_ADRENALINE,
							count: 1,
							isFunctional: false,
							type: "Item",
						},
						{
							templateId: Items.BARTER_H2O2,
							count: 1,
							isFunctional: false,
							type: "Item",
						},
						{
							templateId: Items.FOOD_ALYONKA,
							count: 1,
							isFunctional: false,
							type: "Item",
						},
					],
					productionTime: 31,
					endProduct: Items.STIM_3BTG,
					continuous: false,
					count: 2,
					productionLimitCount: 0,
					isEncoded: false,
					locked: false,
					needFuelForAllProductionTime: false
				}
				const ahf1: IHideoutProduction = {
					_id: "63da4dbee8fa73e225000007",

					areaType: HideoutAreas.MEDSTATION,
					requirements: [
						{
							areaType: HideoutAreas.MEDSTATION,
							requiredLevel: 2,
							type: "Area"
						},
						{
							templateId: Items.DRUGS_AUGMENTIN,
							count: 1,
							isFunctional: false,
							type: "Item",
						},
						{
							templateId: Items.DRUGS_MORPHINE,
							count: 1,
							isFunctional: false,
							type: "Item",
						},
					],
					productionTime: 47,
					endProduct: Items.STIM_AHF1M,
					continuous: false,
					count: 1,
					productionLimitCount: 0,
					isEncoded: false,
					locked: false,
					needFuelForAllProductionTime: false
				}
				const ololo: IHideoutProduction = {
					_id: "63da4dbee8fa73e225000008",

					areaType: HideoutAreas.NUTRITION_UNIT,
					requirements: [
						{
							areaType: HideoutAreas.NUTRITION_UNIT,
							requiredLevel: 3,
							type: "Area"
						},
						{
							templateId: Items.DRINK_GRAND,
							count: 1,
							isFunctional: false,
							type: "Item",
						},
						{
							templateId: Items.DRINK_VITA,
							count: 1,
							isFunctional: false,
							type: "Item",
						},
						{
							templateId: Items.DRINK_APPLE,
							count: 1,
							isFunctional: false,
							type: "Item",
						},
						{
							templateId: Items.DRINK_ICEGREEN,
							count: 1,
							isFunctional: false,
							type: "Item",
						},
						{
							templateId: Items.DRINK_PINEAPPLE,
							count: 1,
							isFunctional: false,
							type: "Item",
						},
						{
							templateId: Items.DRUGS_ANALGIN,
							count: 1,
							isFunctional: false,
							type: "Item",
						},
						{
							templateId: Items.BARTER_WFILTER,
							type: "Tool",
						},
						{
							templateId: Items.BARTER_TEAPOT,
							type: "Tool",
						},
					],
					productionTime: 71,
					endProduct: Items.BARTER_VITAMINS,
					continuous: false,
					count: 3,
					productionLimitCount: 0,
					isEncoded: false,
					locked: false,
					needFuelForAllProductionTime: false
				}
				const l1: IHideoutProduction = {
					_id: "63da4dbee8fa73e225000009",

					areaType: HideoutAreas.MEDSTATION,
					requirements: [
						{
							areaType: HideoutAreas.MEDSTATION,
							requiredLevel: 3,
							type: "Area"
						},
						{
							templateId: Items.STIM_ADRENALINE,
							count: 1,
							isFunctional: false,
							type: "Item",
						},
						{
							templateId: Items.STIM_SJ6,
							count: 1,
							isFunctional: false,
							type: "Item",
						},
					],
					productionTime: 71,
					endProduct: Items.STIM_L1,
					continuous: false,
					count: 1,
					productionLimitCount: 0,
					isEncoded: false,
					locked: false,
					needFuelForAllProductionTime: false
				}

				tables.hideout.production.push(threebTG, adrenaline, l1, ahf1, calok, ophthalmoscope, zagustin, obdolbos, ololo)
			} catch (error) {
				logger.warning(`\nAdditionalCraftingRecipes failed because of another mod. Send bug report. Continue safely.`)
				log(error)
			}
		}

		// if (config.OtherTweaks.CollectorQuestEarlyStart.enabled == true) {
		// WIP, waiting for SPT to update
		// 	// Object.values()
		// 	tables.templates.quests[collectorQuest].conditions.AvailableForFinish.push(
		// 		tables.templates.quests[collectorQuest].conditions.AvailableForStart[0]
		// 	)
		// 	tables.templates.quests[collectorQuest].conditions.AvailableForStart = [
		// 		{
		// 			_parent: "Level",
		// 			_props: {
		// 				id: "51d33b2d4fad9e61441772c0",
		// 				index: 1,
		// 				parentId: "",
		// 				dynamicLocale: false,
		// 				value: 1,
		// 				compareMethod: ">=",
		// 				visibilityConditions: [],
		// 			},
		// 			dynamicLocale: false,
		// 		},
		// 	]
		// }

		function getBarterSchemeByItemAndCurrency(trader: ITrader, resultItem, currency) {
			for (const item of trader.assort.items) {
				if (item._tpl != resultItem) continue;

				for (const scheme of trader.assort.barter_scheme[item._id][0]) {
					if (scheme._tpl == currency) {
						return trader.assort.barter_scheme[item._id][0];
					}
				}
			}

			logger.warning(`\ngetBarterSchemeByItemAndCurrency function failed bacause of the other mod. Ignore this error safely and continue. Send bug report.`)
			log(trader.base._id)
			log(resultItem)
			log(currency)
			return null;
		}

		function getCraft(endProductID) {
			try {
				return tables.hideout.production.find((x) => x.endProduct == endProductID && x.areaType != HideoutAreas.CHRISTMAS_TREE)
			} catch (error) {
				logger.warning(`\ngetCraft function failed bacause of the other mod. Ignore this error safely and continue. Send bug report.`)
				log(endProductID)
				log(error)
			}
		}

		function getCraftByOutputAndInput(outputItem, inputItem) {
			for (const production of tables.hideout.production) {
				if (production.endProduct != outputItem || production.areaType == HideoutAreas.CHRISTMAS_TREE) continue;

				for (const requirement of production.requirements) {
					if (requirement.templateId == inputItem) {
						return production;
					}
				}
			}

			logger.warning(`\ngetCraftByOutputAndInput function failed bacause of the other mod. Ignore this error safely and continue. Send bug report.`)
			log(outputItem)
			log(inputItem)
			return null;
		}

		function getItemInHandbook(itemID) {
			try {
				return handbook.Items.find((i) => i.Id === itemID) // Outs: @Id, @ParentId, @Price
			} catch (error) {
				logger.warning(`\ngetItemInHandbook function failed bacause of the other mod. Ignore this error safely and continue. Send bug report.`)
				log(itemID)
				log(error)
			}
		}

		function getItemName(itemID, locale = "en") {
			if (locales[locale][`${itemID} Name`] != undefined) {
				// return items[itemID]._name
				return locales[locale][`${itemID} Name`]
			} else {
				return items[itemID]?._name
			}
		}

		function roundWithPrecision(num, precision) {
			const multiplier = Math.pow(10, precision)
			return Math.round(num * multiplier) / multiplier
		}
	}
}

function loadConfig(configPath) {
	const configAbsolutePath = path.join(__dirname, configPath);
	const configContents = fs.readFileSync(configAbsolutePath, 'utf-8');
	const config = json5.parse(configContents);

	return config;
}

const log = (i: any) => {
	console.log(i)
}

module.exports = { mod: new Mod() }
