const fs = require('fs');

const page1Text = `
1 1 BA1 Raghvi Bist India CAU 11/10/2004 22 BATTER RHB - - 2 7 Capped 30 Bist
2 1 BA1 Sophia Dunkley England 16/07/1998 28 BATTER RHB RIGHT ARM Leg Spin 6 48 88 3 Capped 50 Dunkley
3 1 BA1 Tejal Hasabnis India MACA 16/08/1997 29 BATTER RHB RIGHT ARM Off Spin - 6 Capped 30 Hasabnis
4 1 BA1 G. Kamalini India TNCA 20/07/2008 18 BATTER LHB RIGHT ARM Off Spin - - 5 14 MI 5 Capped 40 Kamalini
5 1 BA1 Kiran Navgire India KCA 18/09/1994 32 BATTER RHB RIGHT ARM Off Spin - - 6 31 UPW 6 Capped 40 Navgire
6 1 BA1 Ayushi Soni India UPCA 30/09/2000 26 BATTER RHB RIGHT ARM Off Spin - - 1 1 GG 1 Capped 30 Soni
7 2 AL1 Chamari Athapaththu Sri Lanka 09/02/1990 36 ALL-ROUNDER LHB RIGHT ARM Off Spin - 129 173 4 Capped 30 Athapaththu
8 2 AL1 Grace Harris Australia 18/09/1993 33 ALL-ROUNDER RHB RIGHT ARM Off Spin - 12 56 31 RCB 9 Capped 30 Harris
9 2 AL1 Sophie Molineux Australia 17/01/1998 28 ALL-ROUNDER LHB LEFT ARM Slow Orthodox 3 19 51 10 Capped 50 Molineux
10 2 AL1 Orla Prendergast Ireland 01/06/2002 24 ALL-ROUNDER RHB RIGHT ARM Fast Medium - 50 88 Capped 30 Prendergast
11 2 AL1 Sneh Rana India RSPB 18/02/1994 32 ALL-ROUNDER RHB RIGHT ARM Off Spin 6 45 31 27 DC 10 Capped 30 Rana
12 3 WK1 Taniyaa Bhatia India UTCA 28/11/1997 29 WICKETKEEPER RHB 2 19 53 18 DC 0 Capped 30 Bhatia
13 3 WK1 Uma Chetry India ASCA 27/07/2002 24 WICKETKEEPER RHB RIGHT ARM Off Spin - 1 7 9 Capped 30 Chetry
14 3 WK1 Nuzhat Parween India MPCA 05/09/1996 30 WICKETKEEPER RHB - 1 5 Capped 30 Parween
15 3 WK1 Sushma Verma India HPCA 03/11/1992 34 WICKETKEEPER RHB 1 43 19 7 Capped 30 Verma
16 4 FA1 Mithali Ayodya Sri Lanka 13/01/2007 19 BOWLER RHB RIGHT ARM Fast Medium - - 14 Capped 30 Ayodya
17 4 FA1 Rosemary Mair New Zealand 07/11/1998 28 BOWLER RHB RIGHT ARM Fast Medium - 31 48 Capped 30 Mair
18 4 FA1 Titas Sadhu India CAB 29/09/2004 22 BOWLER RHB RIGHT ARM Fast Medium - 8 12 7 GG 0 Capped 30 Sadhu
19 4 FA1 Saima Thakor India MCA 13/09/1996 30 BOWLER RHB RIGHT ARM Fast - 10 3 10 Capped 30 Thakor
20 4 FA1 Tayla Vlaeminck Australia 27/10/1998 28 BOWLER RHB RIGHT ARM Fast 1 8 20 Capped 30 Vlaeminck
21 5 SP1 Saika Ishaque India CAB 08/10/1995 31 BOWLER LHB LEFT ARM Slow Orthodox - 1 3 23 MI 1 Capped 30 Ishaque
22 5 SP1 Priya Mishra India DDCA 04/06/2004 22 BOWLER RHB RIGHT ARM Leg Spin - 9 9 Capped 30 Mishra
23 5 SP1 Nonkululeko Mlaba South Africa 27/06/2000 26 BOWLER RHB LEFT ARM Slow Orthodox 4 54 83 Capped 30 Mlaba
24 5 SP1 Asha Sobhana India KCA 16/03/1991 35 BOWLER RHB RIGHT ARM Leg Spin - 2 6 23 UPW 8 Capped 30 Sobhana
25 6 UBA1 Vrinda Dinesh India KSCA 02/03/2001 25 BATTER RHB RIGHT ARM Off Spin 10 Uncapped 10 Dinesh
26 6 UBA1 Humairaa Kaazi India MCA 05/10/1993 33 BATTER RHB RIGHT ARM Off Spin 17 Uncapped 10 Kaazi
27 6 UBA1 Disha Kasat India VCA 19/09/1997 29 BATTER RHB 10 Uncapped 10 Kasat
28 6 UBA1 Gautami Naik India MACA 15/04/1998 28 BATTER RHB RIGHT ARM Off Spin 6 RCB 6 Uncapped 10 Naik
29 6 UBA1 Shweta Sehrawat India DDCA 26/02/2004 22 BATTER RHB 30 UPW 7 Uncapped 10 Sehrawat
30 6 UBA1 Purvaja Verlekar India GCA 07/04/2001 25 BATTER RHB RIGHT ARM Off Spin Uncapped 10 Verlekar
31 7 UAL1 Sujata Dey India CAB 01/04/2004 22 ALL-ROUNDER LHB LEFT ARM Medium Uncapped 10 Dey
32 7 UAL1 Tess Flintoff Australia 31/03/2003 23 ALL-ROUNDER RHB RIGHT ARM Medium Uncapped 10 Flintoff
33 7 UAL1 Poonam Khemnar India BCA 09/05/1994 32 ALL-ROUNDER RHB RIGHT ARM Leg Spin 17 MI 7 Uncapped 10 Khemnar
34 7 UAL1 Anandita Kishor India JSCA 17/03/2006 20 ALL-ROUNDER RHB RIGHT ARM Fast Medium Uncapped 10 Kishor
35 7 UAL1 Charli Knott Australia 29/11/2002 24 ALL-ROUNDER RHB RIGHT ARM Off Spin 1 UPW 1 Uncapped 10 Knott
36 7 UAL1 Pragati Singh India PCA 29/03/2003 23 ALL-ROUNDER RHB RIGHT ARM Medium Uncapped 10 Singh
37 8 UWK1 Bhavika Ahire India MACA 11/12/2007 19 WICKETKEEPER LHB Uncapped 10 Ahire
38 8 UWK1 Sarah Bryce Scotland 08/01/2000 26 WICKETKEEPER RHB 9 Associate 10 Bryce
39 8 UWK1 Latika Inamdar India VCA 06/12/1999 27 WICKETKEEPER LHB Uncapped 10 Inamdar
40 8 UWK1 Shivani Singh India HPCA 01/01/2001 26 WICKETKEEPER RHB RIGHT ARM Off Spin 1 GG 1 Uncapped 10 Singh
41 9 UFA1 Rima Ekka India OCA 06/03/1998 28 BOWLER RHB RIGHT ARM Fast Medium Uncapped 10 Ekka
42 9 UFA1 Shraddha Pokharkar India MACA 02/08/1996 30 BOWLER RHB LEFT ARM Medium 3 Uncapped 10 Pokharkar
43 9 UFA1 Yashasri S India HYCA 04/09/2003 23 BOWLER RHB RIGHT ARM Fast 1 Uncapped 20 S
44 9 UFA1 Shabnam Shakil India ACA 17/06/2007 19 BOWLER RHB RIGHT ARM Fast Medium 4 Uncapped 10 Shakil
45 9 UFA1 Eddla Srujana India HYCA 17/09/2005 21 BOWLER RHB RIGHT ARM Fast DC 0 Uncapped 10 Srujana
46 10 USP1 Samantha Bates Australia 17/08/1992 34 BOWLER RHB LEFT ARM Slow Orthodox Uncapped 10 Bates
47 10 USP1 Bharti Rawal India DDCA 02/10/2003 23 BOWLER RHB LEFT ARM Slow Orthodox Uncapped 10 Rawal
48 10 USP1 Shanu Sen India RCA 25/01/2003 23 BOWLER RHB LEFT ARM Slow Orthodox Uncapped 10 Sen
49 10 USP1 Parunika Sisodia India DDCA 01/09/2005 21 BOWLER RHB LEFT ARM Slow Orthodox 5 Uncapped 10 Sisodia
50 10 USP1 Sonam Yadav India UPCA 18/07/2007 19 BOWLER RHB LEFT ARM Slow Orthodox Uncapped 10 Yadav
51 11 AL2 Annerie Dercksen South Africa 26/04/2001 25 ALL-ROUNDER RHB RIGHT ARM Fast 2 24 36 Capped 30 Dercksen
52 11 AL2 Heather Graham Australia 10/05/1996 30 ALL-ROUNDER RHB RIGHT ARM Medium - 1 4 1 Capped 40 Graham
53 11 AL2 Jess Jonassen Australia 05/11/1992 34 ALL-ROUNDER LHB LEFT ARM Slow Orthodox 6 93 105 24 Capped 40 Jonassen
54 11 AL2 Kayla Reyneke South Africa 21/10/2005 21 ALL-ROUNDER RHB RIGHT ARM Off Spin - 2 16 Capped 30 Reyneke
55 11 AL2 Chloe Tryon South Africa 25/01/1994 32 ALL-ROUNDER RHB LEFT ARM Slow Orthodox 3 130 131 5 UPW 5 Capped 30 Tryon
56 12 SP2 Preeti Bose India HCA 20/04/1992 34 BOWLER RHB LEFT ARM Slow Orthodox - 1 5 6 Capped 30 Bose
57 12 SP2 Shuchi Upadhyay India MPCA 31/12/2004 22 BOWLER RHB LEFT ARM Slow Orthodox - 1 Capped 30 Upadhyay
58 12 SP2 Devika Vaidya India MACA 13/08/1997 29 BOWLER LHB RIGHT ARM Leg Spin - 12 17 7 Capped 30 Vaidya
59 13 UBA2 Saanika Chalke India MCA 23/01/2006 20 BATTER LHB RIGHT ARM Leg Spin Uncapped 10 Chalke
60 13 UBA2 Pranavi Chandra India HYCA 02/03/2002 24 BATTER RHB Uncapped 10 Chandra
`;

const page2Text = `
61 13 UBA2 Ira Jadhav India MCA 19/02/2010 16 BATTER RHB RIGHT ARM Fast Medium Uncapped 10 Jadhav
62 13 UBA2 Shraddha Nabira India VCA 08/01/2008 18 BATTER RHB RIGHT ARM Leg Spin Uncapped 10 Nabira
63 13 UBA2 Tanisha Ohlan India HCA 08/02/2006 20 BATTER RHB RIGHT ARM Leg Spin Uncapped 20 Ohlan
64 13 UBA2 Varnika Singh India UPCA 11/12/2003 23 BATTER LHB Uncapped 10 Singh
65 14 UAL2 Maitlan Brown Australia 05/06/1997 29 ALL-ROUNDER RHB RIGHT ARM Fast Uncapped 10 Brown
66 14 UAL2 Kathryn Bryce Scotland 17/11/1997 29 ALL-ROUNDER RHB RIGHT ARM Medium 8 Associate 10 Bryce
67 14 UAL2 Darcey Carter Scotland 31/05/2005 21 ALL-ROUNDER RHB RIGHT ARM Off Spin Associate 10 Carter
68 14 UAL2 Uma Kashvi India KSCA 09/04/2011 15 ALL-ROUNDER RHB RIGHT ARM Off Spin Uncapped 10 Kashvi
69 14 UAL2 Amandeep Kaur India HCA 02/03/2003 23 ALL-ROUNDER RHB LEFT ARM Slow Unorthodox Uncapped 10 Kaur
70 14 UAL2 Joshitha V J India KCA 24/07/2006 20 ALL-ROUNDER RHB RIGHT ARM Fast Medium 4 Uncapped 10 V J
71 15 UWK2 Khushi Bhatia India MCA 27/04/2002 24 WICKETKEEPER RHB Uncapped 10 Bhatia
72 15 UWK2 Riya Chaudhari India MCA 18/10/2001 25 WICKETKEEPER RHB Uncapped 10 Chaudhari
73 15 UWK2 Babette De Leede Netherland 08/10/1999 27 WICKETKEEPER RHB Associate 10 De Leede
74 15 UWK2 Pragya Rawat India DDCA 16/07/2002 24 WICKETKEEPER RHB Uncapped 10 Rawat
75 16 UFA2 Anshu Apurva India BICA 20/12/1996 30 BOWLER RHB RIGHT ARM Fast Uncapped 10 Apurva
76 16 UFA2 Yashasvi Katta India RCA 16/04/2004 22 BOWLER LHB LEFT ARM Fast Uncapped 20 Katta
77 16 UFA2 Nandhana Sridharan India TNCA 07/05/2009 17 BOWLER RHB RIGHT ARM Fast Medium Uncapped 10 Sridharan
78 16 UFA2 Jyoti Thakur India HPCA 08/06/1998 28 BOWLER RHB RIGHT ARM Fast Medium Uncapped 10 Thakur
79 16 UFA2 Gargi Wankar India VCA 27/08/1998 28 BOWLER RHB RIGHT ARM Fast Medium Uncapped 10 Wankar
80 17 USP2 Apeksha Anand India DDCA 31/10/2008 18 BOWLER RHB LEFT ARM Slow Orthodox Uncapped 10 Anand
81 17 USP2 Nikita Chauhan India HPCA 01/03/2002 24 BOWLER RHB RIGHT ARM Off Spin Uncapped 10 Chauhan
82 17 USP2 Kirstie Gordon Scotland 20/10/1997 29 BOWLER RHB LEFT ARM Slow Orthodox Associate 10 Gordon
83 17 USP2 Shreya Shrivas India CSCSCA 14/04/2009 17 BOWLER LHB LEFT ARM Slow Orthodox Uncapped 10 Shrivas
84 17 USP2 Poonam Soni India RSPB 03/12/1999 27 BOWLER LHB LEFT ARM Slow Orthodox Uncapped 10 Soni
85 18 AL3 Simran Bahadur India DDCA 13/12/1999 27 ALL-ROUNDER LHB RIGHT ARM Fast Medium - 1 6 6 Capped 30 Bahadur
86 18 AL3 Mona Meshram India VCA 30/09/1991 35 ALL-ROUNDER RHB RIGHT ARM Off Spin - 26 11 Capped 30 Meshram
87 18 AL3 Anjali Sarvani India ACA 28/08/1997 29 ALL-ROUNDER LHB LEFT ARM Fast Medium - - 6 14 Capped 30 Sarvani
88 18 AL3 Meghna Singh India RSPB 18/06/1994 32 ALL-ROUNDER RHB RIGHT ARM Fast Medium 1 17 9 14 Capped 30 Singh
89 19 UBA3 Monika Devi India HPCA 02/09/1996 30 BATTER RHB Uncapped 10 Devi
90 19 UBA3 Divya Ganesh India KCA 06/11/1999 27 BATTER RHB Uncapped 10 Ganesh
91 19 UBA3 Bhavana Goplani India RSPB 30/09/1998 28 BATTER RHB Uncapped 10 Goplani
92 19 UBA3 Harsimran Kaur India PCA 13/09/2007 19 BATTER RHB RIGHT ARM Off Spin Uncapped 10 Kaur
93 19 UBA3 Ayesha Shaikh India MACA 17/08/2002 24 BATTER RHB RIGHT ARM Off Spin Uncapped 10 Shaikh
94 19 UBA3 Inchara Umesh India KSCA 30/03/2009 17 BATTER RHB RIGHT ARM Leg Spin Uncapped 10 Umesh
95 20 UAL3 Nazma Khan India DDCA 08/05/1996 30 ALL-ROUNDER RHB RIGHT ARM Off Spin Uncapped 10 Khan
96 20 UAL3 Vidhi Parmar India BCA 24/05/2009 17 ALL-ROUNDER RHB LEFT ARM Slow Orthodox Uncapped 10 Parmar
97 20 UAL3 Deeksha Sharma India DDCA 18/04/2004 22 ALL-ROUNDER RHB RIGHT ARM Medium Uncapped 10 Sharma
98 20 UAL3 Shivi Sharma India DDCA 18/07/2005 21 ALL-ROUNDER RHB RIGHT ARM Off Spin Uncapped 10 Sharma
99 20 UAL3 Kanishka Thakur India MPCA 20/09/2003 23 ALL-ROUNDER LHB RIGHT ARM Off Spin Uncapped 10 Thakur
100 20 UAL3 Gongadi Trisha India HYCA 15/12/2005 21 ALL-ROUNDER RHB RIGHT ARM Leg Spin UPW 0 Uncapped 10 Trisha
101 21 USP3 Sandhya Chhetri India UPCA 02/09/2002 24 BOWLER LHB LEFT ARM Slow Orthodox Uncapped 10 Chhetri
102 21 USP3 Ramyashri K N India TNCA 07/10/2002 24 BOWLER RHB LEFT ARM Slow Orthodox Uncapped 10 K N
103 21 USP3 Chandni Sharma India UPCA 19/09/2006 20 BOWLER RHB RIGHT ARM Leg Spin Uncapped 10 Sharma
104 21 USP3 Sumiti Soni India DDCA 08/01/2007 19 BOWLER LHB LEFT ARM Slow Orthodox Uncapped 10 Soni
105 22 UAL4 Akshita Bhagat India PCA 12/10/2006 20 ALL-ROUNDER RHB RIGHT ARM Fast Medium Uncapped 10 Bhagat
106 22 UAL4 Esha Oza UAE 08/01/1998 28 ALL-ROUNDER RHB RIGHT ARM Off Spin Associate 10 Oza
107 22 UAL4 Maddie Penna Australia 30/08/2000 26 ALL-ROUNDER RHB RIGHT ARM Leg Spin Uncapped 10 Penna
108 22 UAL4 Aayushi Shukla India MPCA 07/08/2007 19 ALL-ROUNDER LHB LEFT ARM Slow Orthodox Uncapped 10 Shukla
109 22 UAL4 Anaadi Tagde India MPCA 31/03/2008 18 ALL-ROUNDER RHB RIGHT ARM Fast Medium Uncapped 10 Tagde
110 22 UAL4 Triveni Vashistha India HCA 30/05/2007 19 ALL-ROUNDER LHB LEFT ARM Slow Orthodox 4 MI 4 Uncapped 20 Vashistha
111 23 UAL5 Manali Dakshini India MCA 29/09/1997 29 ALL-ROUNDER RHB RIGHT ARM Fast Medium Uncapped 10 Dakshini
112 23 UAL5 Roshini Kiran India KSCA 08/06/2004 22 ALL-ROUNDER RHB RIGHT ARM Off Spin Uncapped 10 Kiran
113 23 UAL5 Palnati Rishika Krishnan India ACA 05/11/2010 16 ALL-ROUNDER LHB LEFT ARM Slow Orthodox Uncapped 10 Krishnan
114 23 UAL5 Henrietta Pereira India ACA 13/07/2002 24 ALL-ROUNDER RHB RIGHT ARM Leg Spin Uncapped 10 Pereira
115 23 UAL5 Tanisha Singh India DDCA 22/02/2003 23 ALL-ROUNDER RHB RIGHT ARM Off Spin Uncapped 10 Singh
116 23 UAL5 Sonal Thakur India HPCA 29/07/2002 24 ALL-ROUNDER RHB RIGHT ARM Leg Spin Uncapped 10 Thakur
117 24 UAL6 Keerthana Balakrishnan India TNCA 08/10/2000 26 ALL-ROUNDER RHB RIGHT ARM Leg Spin 4 Uncapped 10 Balakrishnan
118 24 UAL6 Kira Chathli England 29/07/1999 27 ALL-ROUNDER RHB Uncapped 10 Chathli
119 24 UAL6 Salonee Dangore India MPCA 24/05/1998 28 ALL-ROUNDER RHB RIGHT ARM Leg Spin Uncapped 10 Dangore
120 24 UAL6 Arya Gohane India VCA 09/10/2000 26 ALL-ROUNDER RHB RIGHT ARM Fast Medium Uncapped 10 Gohane
`;

const page3Text = `
121 24 UAL6 Milly Illingworth Australia 15/07/2005 21 ALL-ROUNDER RHB RIGHT ARM Fast MI 0 Uncapped 10 Illingworth
122 24 UAL6 Nalla Reddy India HYCA 13/08/2004 22 ALL-ROUNDER RHB RIGHT ARM Fast 1 MI 1 Uncapped 10 Reddy
123 25 UAL7 Suman Meena India RCA 08/07/2000 26 ALL-ROUNDER RHB RIGHT ARM Fast UPW 0 Uncapped 10 Meena
124 25 UAL7 Sonia Mendhiya India HCA 20/05/2004 22 ALL-ROUNDER RHB RIGHT ARM Off Spin Uncapped 10 Mendhiya
125 25 UAL7 Anshu Nagar India DDCA 26/01/2011 15 ALL-ROUNDER LHB LEFT ARM Fast Uncapped 10 Nagar
126 25 UAL7 Dnyaneshwari Patil India MACA 27/05/2007 19 ALL-ROUNDER RHB RIGHT ARM Fast Medium Uncapped 10 Patil
127 25 UAL7 Sahana Pawar India KSCA 20/11/1996 30 ALL-ROUNDER RHB LEFT ARM Slow Orthodox 1 Uncapped 10 Pawar
128 25 UAL7 Karri Poojitha India ACA 02/09/2003 23 ALL-ROUNDER RHB RIGHT ARM Leg Spin Uncapped 10 Poojitha
129 26 UAL8 Kaku Barman India ASCA 19/11/2008 18 ALL-ROUNDER RHB RIGHT ARM Leg Spin Uncapped 10 Barman
130 26 UAL8 Bidisha Dey India CAB 28/12/2006 20 ALL-ROUNDER RHB RIGHT ARM Fast Medium Uncapped 10 Dey
131 26 UAL8 Shishira Gowda India KSCA 06/09/2001 25 ALL-ROUNDER LHB RIGHT ARM Fast Medium Uncapped 10 Gowda
132 26 UAL8 Dimple Kanwar India RCA 11/09/2006 20 ALL-ROUNDER RHB RIGHT ARM Fast Medium Uncapped 10 Kanwar
133 26 UAL8 Sonali Singh India UPCA 28/02/2003 23 ALL-ROUNDER RHB RIGHT ARM Medium Uncapped 10 Singh
134 26 UAL8 Mithila Vinod India KSCA 12/09/2005 21 ALL-ROUNDER RHB RIGHT ARM Fast Medium Uncapped 10 Vinod
135 27 UAL9 Fatima Jaffer India MCA 09/09/2002 24 ALL-ROUNDER RHB LEFT ARM Slow Orthodox Uncapped 10 Jaffer
136 27 UAL9 Karnika Karthick India KSCA 30/06/2010 16 ALL-ROUNDER RHB RIGHT ARM Medium Uncapped 10 Karthick
137 27 UAL9 Ishita Khale India MACA 05/03/2004 22 ALL-ROUNDER RHB LEFT ARM Slow Orthodox Uncapped 10 Khale
138 27 UAL9 Pragya Rawat India BCA 04/04/2000 26 ALL-ROUNDER LHB LEFT ARM Fast Medium Uncapped 10 Rawat
139 27 UAL9 Neetu Singh India PCA 02/02/1999 27 ALL-ROUNDER RHB RIGHT ARM Leg Spin Uncapped 10 Singh
140 27 UAL9 Soumya Singh India MCA 05/11/2000 26 ALL-ROUNDER RHB LEFT ARM Slow Orthodox Uncapped 10 Singh
141 28 UAL10 Jazmine Gill India HYCA 01/06/2009 17 ALL-ROUNDER LHB LEFT ARM Slow Orthodox Uncapped 10 Gill
142 28 UAL10 Bharati Singh India UPCA 15/04/2009 17 ALL-ROUNDER RHB RIGHT ARM Leg Spin Uncapped 10 Singh
143 28 UAL10 Kalpana Singh India UPCA 27/07/2007 19 ALL-ROUNDER RHB RIGHT ARM Fast Medium Uncapped 10 Singh
144 28 UAL10 Palak Singh India CSCSCA 20/11/2010 16 ALL-ROUNDER RHB RIGHT ARM Fast Uncapped 10 Singh
145 28 UAL10 Rekha Singh India UPCA 08/08/2003 23 ALL-ROUNDER RHB RIGHT ARM Fast Medium Uncapped 10 Singh
146 28 UAL10 Nisha Verma India UPCA 10/11/2008 18 ALL-ROUNDER RHB RIGHT ARM Off Spin Uncapped 10 Verma
`;

const lines = [
  ...page1Text.trim().split('\n'),
  ...page2Text.trim().split('\n'),
  ...page3Text.trim().split('\n')
].map(l => l.trim()).filter(l => l.length > 0);

const countries = ['India', 'England', 'Australia', 'South Africa', 'Sri Lanka', 'New Zealand', 'Ireland', 'Scotland', 'Netherland', 'UAE'];
const specialisms = ['BATTER', 'ALL-ROUNDER', 'WICKETKEEPER', 'BOWLER'];
const classifications = ['Capped', 'Uncapped', 'Associate'];

const players = [];

for (const line of lines) {
  const tokens = line.split(/\s+/);
  const listSrNo = parseInt(tokens[0], 10);
  const setNo = parseInt(tokens[1], 10);
  const setCode = tokens[2];

  // Find C/U/A index
  let cuaIdx = -1;
  let cuaStatus = '';
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (classifications.includes(tokens[i])) {
      cuaIdx = i;
      cuaStatus = tokens[i];
      break;
    }
  }

  if (cuaIdx === -1) {
    console.error('Failed to find C/U/A for:', line);
    continue;
  }

  const reservePriceLakh = parseInt(tokens[cuaIdx + 1], 10);
  const surnameFromEnd = tokens.slice(cuaIdx + 2).join(' ');

  // Find country
  let country = '';
  let countryIdx = -1;
  for (const c of countries) {
    const cTokens = c.split(' ');
    for (let i = 3; i < tokens.length; i++) {
      if (cTokens.length === 1 && tokens[i] === c) {
        country = c;
        countryIdx = i;
        break;
      } else if (cTokens.length === 2 && tokens[i] === cTokens[0] && tokens[i+1] === cTokens[1]) {
        country = c;
        countryIdx = i;
        break;
      }
    }
    if (country) break;
  }

  const nameTokens = tokens.slice(3, countryIdx);
  // Name handling: first name is everything before the surname
  let firstName = '';
  let surname = surnameFromEnd;

  // Let's deduce firstName
  const fullNameCandidate = nameTokens.join(' ');
  if (fullNameCandidate.endsWith(surname)) {
    firstName = fullNameCandidate.slice(0, -surname.length).trim();
  } else {
    // If nameTokens length == 1, firstName is that token
    firstName = nameTokens[0];
  }

  const fullName = `${firstName} ${surname}`.trim();

  // Find DOB
  let dobIdx = -1;
  for (let i = countryIdx + 1; i < tokens.length; i++) {
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(tokens[i])) {
      dobIdx = i;
      break;
    }
  }

  let stateAssociation = null;
  const countryTokenCount = country.includes(' ') ? 2 : 1;
  if (dobIdx > countryIdx + countryTokenCount) {
    stateAssociation = tokens.slice(countryIdx + countryTokenCount, dobIdx).join(' ');
  }

  const dob = tokens[dobIdx];
  const age = parseInt(tokens[dobIdx + 1], 10);

  // Specialism
  let specialism = '';
  let specIdx = -1;
  for (let i = dobIdx + 2; i < tokens.length; i++) {
    if (specialisms.includes(tokens[i])) {
      specialism = tokens[i];
      specIdx = i;
      break;
    }
  }

  // Batting hand
  let battingHand = null;
  let batIdx = specIdx;
  if (tokens[specIdx + 1] === 'RHB' || tokens[specIdx + 1] === 'LHB') {
    battingHand = tokens[specIdx + 1];
    batIdx = specIdx + 1;
  }

  // Bowling style
  const bowlStyles = [
    'RIGHT ARM Fast Medium',
    'RIGHT ARM Fast',
    'RIGHT ARM Medium',
    'RIGHT ARM Leg Spin',
    'RIGHT ARM Off Spin',
    'LEFT ARM Fast Medium',
    'LEFT ARM Fast',
    'LEFT ARM Medium',
    'LEFT ARM Slow Orthodox',
    'LEFT ARM Slow Unorthodox'
  ];

  const middleTokens = tokens.slice(batIdx + 1, cuaIdx);
  const middleStr = middleTokens.join(' ');
  let bowlingStyle = null;

  for (const bs of bowlStyles) {
    if (middleStr.includes(bs)) {
      bowlingStyle = bs;
      break;
    }
  }

  // Previous WPL team
  let prevWplTeam = null;
  let prevWplMatches = null;
  const teams = ['RCB', 'MI', 'UPW', 'GG', 'DC'];
  for (let i = 0; i < middleTokens.length; i++) {
    if (teams.includes(middleTokens[i])) {
      prevWplTeam = middleTokens[i];
      if (i + 1 < middleTokens.length && /^\d+$/.test(middleTokens[i+1])) {
        prevWplMatches = parseInt(middleTokens[i+1], 10);
      }
      break;
    }
  }

  players.push({
    id: listSrNo,
    listSrNo,
    setNo,
    setCode,
    firstName,
    surname,
    fullName,
    country,
    isOverseas: country !== 'India',
    stateAssociation: stateAssociation || null,
    dob,
    age,
    specialism, // BATTER, ALL-ROUNDER, WICKETKEEPER, BOWLER
    battingHand, // RHB, LHB
    bowlingStyle,
    previousWplTeam: prevWplTeam,
    previousWplMatches: prevWplMatches,
    classification: cuaStatus, // Capped, Uncapped, Associate
    basePriceLakh: reservePriceLakh
  });
}

console.log('Parsed count:', players.length);
fs.writeFileSync('./players.json', JSON.stringify(players, null, 2));
console.log('Saved players.json successfully!');
