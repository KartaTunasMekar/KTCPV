import { NextResponse } from 'next/server';
import { db } from '../../../../../src/lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    const matchId = params.id;
    const matchRef = doc(db, 'matches', matchId);
    
    await deleteDoc(matchRef);
    
    return NextResponse.json({ message: 'Match deleted successfully' });
  } catch (error) {
    console.error('Error deleting match:', error);
    return NextResponse.json(
      { error: 'Failed to delete match' },
      { status: 500 }
    );
  }
} 