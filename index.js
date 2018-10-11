String.prototype.clr = function (hexColor) { return `<font color="#${hexColor}">${this}</font>` };
const format = require('./format.js');

const path = require('path');
const fs = require('fs');
const config = require('./config.json');
const logFolder = path.join(__dirname, 'boss_logs');
if (!fs.existsSync(logFolder)) fs.mkdirSync(logFolder);

module.exports = function BossSkillLogger(dispatch) {    

	let enabled = config.enabled,
		writeLog = config.writeLog,
		cid = null,
		party = [];

	var stream;

	dispatch.command.add('bosslog', () => {
		enabled = !enabled;
		writeLog = !writeLog;
		dispatch.command.message('记录王的技能ID ' + enabled ? '启用'.clr('00FFFF') : '禁用'.clr('E69F00'));

		if (writeLog) { 
			if (enabled) {
				let filename = path.join(logFolder, Date.now() + '.js');
				stream = fs.createWriteStream(filename);
			} else {
				if (stream) {
					try {
						stream.end();
					} catch (e) {
						console.log(e);
					}
				}
			}
		}
	})

	dispatch.hook('S_LOGIN', 10, (event) => {
		cid = event.gameId;
	})

	dispatch.hook('S_EXIT', 3, (event) => {
		if (stream) {
			try {
				stream.end();
			} catch (e) {
				console.log(e);
			}
		}
	})

	dispatch.hook('S_PARTY_MEMBER_LIST', 7, (event) => {
		party = event;
	})

	dispatch.hook('S_BOSS_GAGE_INFO', 3, (event) => { 
		if (!enabled) return;
		if (writeLog)
			stream.write(
				'\n' + new Date().toLocaleTimeString() + 
				' |S_BOSS_GAGE_INFO|:	' + event.id + 
				'	huntingZoneId: ' + event.huntingZoneId + 
				'		templateId: '+ event.templateId
			);
	})

	dispatch.hook('S_ACTION_STAGE', 8, (event) => {
		if (!enabled || (event.gameId - cid == 0)) return;
		for (let i in party.members) {
			if (party.members[i].gameId - event.gameId == 0) return;
		}
		if (event.stage > 0) return;
		sendChat('ACTION: ' + `${event.skill.id % 1000}`.clr('E69F00'));
		if (writeLog)
			stream.write(
				'\n' + new Date().toLocaleTimeString() + 
				' |S_ACTION_STAGE|:		' + event.gameId + 
				'	skill: ' + event.skill + 
				'	id: ' + event.id + 
				'	stage: ' + event.stage
			);
	})

	dispatch.hook('S_DUNGEON_EVENT_MESSAGE', 2, (event) => {
		if (!enabled) return;
		sendChat('MESSAGE: ' + `${event.message}`.clr('00FFFF'));
		if (writeLog)
			stream.write(
				'\n' + new Date().toLocaleTimeString() + 
				' |S_DUNGEON_EVENT_MESSAGE|:	' + event.message
			);
	})

	dispatch.hook('S_CHAT', 2, (event) => {
		if (!enabled) return;
		if (event.channel == 1 || event.channel == 21 || event.channel == 0) {
			if (writeLog)
				stream.write(
					'\n' + new Date().toLocaleTimeString() + 
					' |S_CHAT|: ' + event.authorName + 
					'	: ' + event.message
				);
		}
	}) 

    function getTime() {
        var time = new Date();
        var timeStr = ("0" + time.getHours()).slice(-2) + ":" + ("0" + time.getMinutes()).slice(-2) + ":" + ("0" + time.getSeconds()).slice(-2);
        return timeStr;
    }
    
    function sendChat(msg) {
		dispatch.command.message(
			getTime() + ' - ' + msg
		)
    }

}
