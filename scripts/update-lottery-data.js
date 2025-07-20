const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

// Path to your CSV file
const csvPath = path.join(__dirname, '../maindata_raw/raw/Lottery_Full_Raw_Data.csv');

// Read and parse the CSV
const csv = fs.readFileSync(csvPath, 'utf-8');
const records = parse(csv, { columns: true, skip_empty_lines: true });

// Find the latest round in the CSV
let latestRound = Math.max(...records.map(r => Number(r.Round)));
console.log('Latest round in CSV:', latestRound);

// Helper to fetch a round from the official API
async function fetchRound(round) {
  const url = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${round}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch round ' + round);
  const data = await res.json();
  if (data.returnValue !== 'success') return null;
  return data;
}

// Convert API data to CSV row format
function apiDataToCsvRow(data) {
  return {
    Year: data.drwNoDate.split('.')[0],
    Round: data.drwNo,
    Date: data.drwNoDate,
    winning_number_first_digit: data.drwtNo1,
    winning_number_second_digit: data.drwtNo2,
    winning_number_third_digit: data.drwtNo3,
    winning_number_fourth_digit: data.drwtNo4,
    winning_number_fifth_digit: data.drwtNo5,
    winning_number_sixth_digit: data.drwtNo6,
    winning_number_bonus_digit: data.bnusNo,
  };
}

// Main update function
async function updateLottoCsv() {
  let newRows = [];
  let round = latestRound + 1;
  while (true) {
    console.log('Checking round', round);
    const data = await fetchRound(round);
    if (!data) break; // No more new rounds
    newRows.push(apiDataToCsvRow(data));
    round++;
  }
  if (newRows.length === 0) {
    console.log('No new rounds found.');
    return;
  }
  // Append new rows to CSV
  const updatedRecords = records.concat(newRows);
  const output = stringify(updatedRecords, { header: true });
  fs.writeFileSync(csvPath, output, 'utf-8');
  console.log(`Appended ${newRows.length} new round(s) to the CSV!`);
}

updateLottoCsv().catch(err => {
  console.error('Error updating lotto data:', err);
  process.exit(1);
}); 