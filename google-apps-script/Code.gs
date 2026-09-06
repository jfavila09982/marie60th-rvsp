const SHEET_NAME = 'Sheet1';
const HEADERS = ['Timestamp', 'Name', 'Attending', 'Party Size', 'Family Members', 'Notes'];

function setup() {
  const sheet = getResponseSheet_();
  SpreadsheetApp.flush();
  console.log('RSVP sheet ready: ' + sheet.getParent().getUrl() + '#gid=' + sheet.getSheetId());
  return sheet.getParent().getUrl();
}

function doGet(event) {
  try {
    const sheet = getResponseSheet_();
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return output_({ ok: true, guests: [] }, event);

    const rows = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getDisplayValues();
    const guests = rows
      .filter(function (row) { return row[1].trim() !== ''; })
      .map(function (row) {
        return {
          timestamp: row[0],
          name: row[1],
          attending: row[2],
          partySize: Number(row[3]) || 0,
          familyNames: row[4],
          notes: row[5] || ''
        };
      })
      .reverse();

    return output_({ ok: true, guests: guests }, event);
  } catch (error) {
    return output_({ ok: false, error: error.message }, event);
  }
}

function doPost(event) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const params = event && event.parameter ? event.parameter : {};
    const name = clean_(params.name, 80);
    const attending = params.attending === 'yes' ? 'yes' : params.attending === 'no' ? 'no' : '';
    const partySize = attending === 'yes' ? Math.min(Math.max(Number(params.partySize) || 1, 1), 20) : 0;
    const familyNames = attending === 'yes' ? clean_(params.familyNames, 500) : '';
    const notes = clean_(params.notes, 1000);

    if (!name) throw new Error('A guest name is required.');
    if (!attending) throw new Error('Attendance selection is required.');

    getResponseSheet_().appendRow([new Date(), name, attending, partySize, familyNames, notes]);
    return json_({ ok: true });
  } catch (error) {
    return json_({ ok: false, error: error.message });
  } finally {
    lock.releaseLock();
  }
}

function getResponseSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('Open this project from the spreadsheet using Extensions > Apps Script.');
  }
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  } else if (sheet.getRange(1, 6).getDisplayValue() !== HEADERS[5]) {
    sheet.getRange(1, 6).setValue(HEADERS[5]).setFontWeight('bold');
  }
  return sheet;
}

function clean_(value, maxLength) {
  let text = String(value || '').trim().slice(0, maxLength);
  // Prevent spreadsheet formula injection while preserving what visitors see.
  if (/^[=+\-@]/.test(text)) text = "'" + text;
  return text;
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function output_(payload, event) {
  const callback = event && event.parameter ? String(event.parameter.callback || '') : '';
  if (/^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(callback)) {
    return ContentService
      .createTextOutput(callback + '(' + JSON.stringify(payload) + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return json_(payload);
}
