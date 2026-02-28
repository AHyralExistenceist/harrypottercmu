import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function parseEffects(description: string): any | null {
  const hpMatch = description.match(/HP\+(\d+)/);
  if (hpMatch) {
    return { hp: parseInt(hpMatch[1]) };
  }
  return null;
}

const itemsData = [
  { name: '머트랩 용액', price: 80, description: 'HP+20', imageUrl: 'https://i.imgur.com/wYbpxOV.png' },
  { name: '꽃박하 진액', price: 100, description: 'HP+30', imageUrl: 'https://i.imgur.com/FDVCVdP.png' },
  { name: '디터니 원액', price: 120, description: 'HP+50', imageUrl: 'https://i.imgur.com/fY05iyo.png' },
  { name: '움직이는 용 모형', price: 40, description: '새근새근 잠자고 있는 조그마한 용 피규어입니다. 제자리에서 벗어나지 않지만 잘못 만져서 눈을 뜨면 가까운 사람을 물기도 합니다.', imageUrl: 'https://i.imgur.com/QVlzbUw.png' },
  { name: '움직이는 빗자루 모형', price: 40, description: '제자리에서 둥둥 떠 있는 조그마한 빗자루 피규어입니다. 빗자루 위에 무엇을 올려도... 심지어 사람이 올라가도... 평온을 유지하는 놀라울정도로 정교한 균형마법이 걸려있습니다.', imageUrl: 'https://i.imgur.com/A2CSofC.png' },
  { name: '수상한 토템', price: 80, description: '세로 3cm 정도의 조그마한 토템입니다. 소지한 후 하루 뒤에 주변의 특정한 인물(본인 포함)의 모습으로 변화합니다. 2개 이상 소지했을 경우... 자의식을 가진 이 토템들은 주인이 안 보는 사이에 자기들끼리 순서를 바꾸며 뭉쳐있는 걸 즐긴답니다!(*`!토템` 명령어를 통해 토템들의 모습을 확인할 수 있습니다)', imageUrl: 'https://i.imgur.com/eRsOTWe.png' },
  { name: '그리핀도르 깃펜', price: 80, description: '붉은색 잉크가 끝없이 나오는 기숙사 인장이 새겨진 마법 깃펜입니다. 그리핀도르 기숙사 친구에게 쪽지를 보낼 수 있습니다.(* `!깃펜 닉네임` 명령어를 그리핀도르 기숙사 친구를 대상으로 사용할 수 있는 권한을 부여합니다)', imageUrl: 'https://i.imgur.com/ZAuLhbo.png' },
  { name: '래번클로 깃펜', price: 80, description: '푸른색 잉크가 끝없이 나오는 기숙사 인장이 새겨진 마법 깃펜입니다. 래번클로 기숙사 친구에게 쪽지를 보낼 수 있습니다.(* `!깃펜 닉네임` 명령어를 래번클로 기숙사 친구를 대상으로 사용할 수 있는 권한을 부여합니다)', imageUrl: 'https://i.imgur.com/AFehN3I.png' },
  { name: '슬리데린 깃펜', price: 80, description: '초록색 잉크가 끝없이 나오는 기숙사 인장이 새겨진 마법 깃펜입니다. 슬리데린 기숙사 친구에게 쪽지를 보낼 수 있습니다.(* `!깃펜 닉네임` 명령어를 슬리데린 기숙사 친구를 대상으로 사용할 수 있는 권한을 부여합니다)', imageUrl: 'https://i.imgur.com/QQVdtQ7.png' },
  { name: '후플푸프 깃펜', price: 80, description: '노란색 잉크가 끝없이 나오는 기숙사 인장이 새겨진 마법 깃펜입니다. 후플푸프 기숙사 친구에게 쪽지를 보낼 수 있습니다.(* `!깃펜 닉네임` 명령어를 후플푸프 기숙사 친구를 대상으로 사용할 수 있는 권한을 부여합니다)', imageUrl: 'https://i.imgur.com/jPq8924.png' },
  { name: '종코의 돋보기', price: 80, description: '종코의 장난감 가게에서 종코씨가 애용하는 분석용 마법도구입니다. 익명으로 보내진 쪽지의 마법을 분석하면 보낸 사람을 알아낼 수도 있겠군요. \n세 번 사용하면 사라져버립니다', imageUrl: 'https://i.imgur.com/9Tco5AK.png' },
  { name: '화려한 양말', price: 50, description: '엄청나게 화려한 자수가 놓인 양말입니다. 패션의 완성은 양말이죠! 당신의 패션 철학을 모두에게 알려봅시다!', imageUrl: 'https://i.imgur.com/hs3HGPh.png' },
  { name: '개구리 초콜릿', price: 50, description: '움직이는 개구리 모양 초콜릿입니다.', imageUrl: 'https://i.imgur.com/oD0OI5Y.png' },
  { name: '허니듀크스 초콜릿', price: 50, description: '일반 초콜릿에 비해 맛이 아주 좋고 크기도 큰 판 초콜릿입니다!', imageUrl: 'https://i.imgur.com/bkY1BAt.png' },
  { name: '바퀴벌레 과자', price: 50, description: '윗 부분은 바삭바삭하고 단단한 초콜릿으로 이뤄져 있고... 배 아래부분을 씹으면 초코무스가 즙처럼 터져나온답니다. 맛있겠지요?', imageUrl: 'https://i.imgur.com/NY4Pmz2.png' },
  { name: '피징 위즈비', price: 50, description: '먹으면 몇미터정도 몸이 둥둥 떠오릅니다. 레몬 탄산수 맛이 납니다!', imageUrl: 'https://i.imgur.com/D8ULGyk.png' },
  { name: '버터맥주', price: 50, description: '스리 브룸스틱스 주점의 영원한 스테디셀러! 버터맥주입니다! 무알콜로 학생들도 마실 수 있답니다. 부드럽고 따뜻한 맛이 납니다.', imageUrl: 'https://i.imgur.com/ud4eQMM.png' },
  { name: '포장된 젤리빈', price: 50, description: '온갖 맛이 나는 젤리빈 세트입니다! ', imageUrl: 'https://i.imgur.com/o4hiPTG.png' },
  { name: '글래드래그스의 지팡이', price: 140, description: '글래드래그스 마법사 옷가게에서 판매하는 1회용 지팡이. 사용 대상에게 지팡이 끝을 가져다 대면 원하는 의상을 입힐 수 있습니다! ', imageUrl: 'https://i.imgur.com/YjV5wkN.png' },
  { name: '아재의 투척 포션', price: 140, description: '말투가.급격히. 나이가들어보임*^^*실제로.늙지는않아ㅡ\'\'ㅡ.마음만은.푸르른.꽃!청춘!꾸밈업이마음을.표현합시다 덜~', imageUrl: 'https://i.imgur.com/9iL1AZv.png' },
  { name: '3인칭으로 말해요 투척 포션', price: 140, description: '포션이는 네가 이렇게 말해줬으면 좋겠어. 안그러면 포션이는 기분이 나빠질 것 같아...', imageUrl: 'https://i.imgur.com/UOIQkzy.png' },
  { name: '어둠의 dark한 투척 포션', price: 140, description: '쳇. 오늘도 쓸데없는 짓을 말을 해버리는군. 아아- 저 하늘의 월광이 빛나는 혈육의 밤이여...', imageUrl: 'https://i.imgur.com/fvsmve3.png' },
  { name: '시부야 집사의 투척 포션', price: 140, description: '즉시 아가씨를 위한 완벽한 집사로 탈바꿈합니다. 의상은 지원해주지 못해 안타까울 따름입니다... 그러나 한떨기 장미처럼 아름다운 아가씨를 위해 최선을 다할 것입니다. 아. 이런이런... 제작자의 실수로 모두를 아가씨로 칭한다고 고지하는 것을 깜빡했군요.', imageUrl: 'https://i.imgur.com/4bN1m9u.png' },
  { name: '새침데기 아가씨의 투척 포션', price: 140, description: '흥! 어서 품위와 교양을 갖추지 못하겠어요?  레이디-를 위한 성의가 눈꼽만큼도 보이지 않아 정말 실망스러워요.', imageUrl: 'https://i.imgur.com/67GWh1n.png' },
  { name: '똥폭탄', price: 10, description: '비슷한 질감의 다른 무언가의 이름으로 대체해서 부르고 있긴 합니다만...사실은 초콜릿을 조합해 만든 다소 묽은...질감의 물폭탄입니다.', imageUrl: 'https://i.imgur.com/fQVOzwm.png' }
];

async function importItems() {
  try {
    console.log('Starting item import...');
    
    for (const itemData of itemsData) {
      const existingItem = await prisma.item.findFirst({
        where: { name: itemData.name }
      });

      if (existingItem) {
        console.log(`Item "${itemData.name}" already exists, skipping...`);
        continue;
      }

      const effects = parseEffects(itemData.description);
      
      const item = await prisma.item.create({
        data: {
          name: itemData.name,
          description: itemData.description,
          type: 'consumable',
          imageUrl: itemData.imageUrl,
          effects: effects ? JSON.stringify(effects) : null,
          price: itemData.price,
          isGacha: false,
          rarity: 1
        }
      });

      console.log(`Created item: ${item.name}`);
    }

    console.log('Item import completed!');
  } catch (error) {
    console.error('Error importing items:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importItems();

