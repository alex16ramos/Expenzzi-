import { readFileSync } from 'fs';
import { prisma } from '../src/lib/db';

async function applySetup() {
  console.log('Aplicando setup.sql por bloques en Neon...');
  try {
    const rawSql = readFileSync('setup.sql', 'utf-8');

    // Split SQL by blank lines followed by section comments or top-level CREATE/ALTER/DO
    // Or replace function blocks cleanly
    const blocks: string[] = [];
    let currentBlock = '';

    const lines = rawSql.split('\n');
    let inDollarBlock = false;

    for (const line of lines) {
      const trimmed = line.trim();
      currentBlock += line + '\n';

      if (trimmed.includes('$$')) {
        inDollarBlock = !inDollarBlock;
      }

      if (!inDollarBlock && trimmed.endsWith(';')) {
        if (currentBlock.trim().length > 0) {
          blocks.push(currentBlock.trim());
          currentBlock = '';
        }
      }
    }

    if (currentBlock.trim().length > 0) {
      blocks.push(currentBlock.trim());
    }

    console.log(`Encontrados ${blocks.length} bloques SQL independientes en setup.sql`);

    let count = 0;
    for (const block of blocks) {
      if (block.startsWith('--')) {
        // Strip leading comments if only comments
        const clean = block.split('\n').filter(l => !l.trim().startsWith('--')).join('\n').trim();
        if (!clean) continue;
      }

      try {
        await prisma.$executeRawUnsafe(block);
        count++;
      } catch (err: unknown) {
        const msg = (err as { message?: string })?.message || String(err);
        if (msg.includes('already exists') || msg.includes('multiple primary keys')) {
          count++;
        } else {
          console.warn(`[Aviso en bloque ${count + 1}]: ${msg.slice(0, 150)}`);
        }
      }
    }

    console.log(`✅ ${count} de ${blocks.length} bloques SQL ejecutados exitosamente.`);
  } catch (err) {
    console.error('Error aplicando setup:', err);
  } finally {
    await prisma.$disconnect();
  }
}

applySetup();
