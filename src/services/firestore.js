import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const USERS = 'users';
const VOTES = 'votes';
const RESULTS_DOC = 'main';
const RESULTS_COLLECTION = 'results';

export async function upsertUser(uid, { displayName, photoURL, email }) {
  const ref = doc(db, USERS, uid);
  await setDoc(ref, { displayName, photoURL, email }, { merge: true });
}

export async function getUser(uid) {
  const ref = doc(db, USERS, uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function submitVote(uid, answers) {
  const ref = doc(db, VOTES, uid);
  await setDoc(ref, { answers, submittedAt: serverTimestamp() });
}

export async function getVote(uid) {
  const ref = doc(db, VOTES, uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function getAllVotes() {
  const snap = await getDocs(collection(db, VOTES));
  const list = [];
  snap.forEach((d) => list.push({ uid: d.id, ...d.data() }));
  return list;
}

export async function getResults() {
  const ref = doc(db, RESULTS_COLLECTION, RESULTS_DOC);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function setResults(winners, published = false) {
  const ref = doc(db, RESULTS_COLLECTION, RESULTS_DOC);
  await setDoc(ref, { winners, published }, { merge: true });
}

export async function setBetsClosed(closed) {
  const ref = doc(db, RESULTS_COLLECTION, RESULTS_DOC);
  await setDoc(ref, { betsClosed: !!closed }, { merge: true });
}

export async function getAllUsers() {
  const snap = await getDocs(collection(db, USERS));
  const map = {};
  snap.forEach((d) => {
    map[d.id] = d.data();
  });
  return map;
}
