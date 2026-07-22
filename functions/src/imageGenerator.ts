import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load fonts
const robotoRegular = fs.readFileSync(path.join(__dirname, 'fonts', 'Roboto-Regular.ttf'));
const robotoBold = fs.readFileSync(path.join(__dirname, 'fonts', 'Roboto-Bold.ttf'));

export interface TemplateData {
  themeColor: string;
  type: 'birthday' | 'anniversary' | 'baptism';
  name: string;
  message: string;
  churchName: string;
}

const TITLES = {
  anniversary: 'WISHING YOU A\nHAPPY ANNIVERSARY',
  baptism: 'CELEBRATING YOUR\nBAPTISM ANNIVERSARY',
  birthday: 'WISHING YOU A\nHAPPY BIRTHDAY'
};

export async function generateCelebrationImage(data: TemplateData): Promise<Buffer> {
  const { themeColor, type, name, message, churchName } = data;
  const titleLines = (TITLES[type] || 'CELEBRATING WITH YOU').split('\n');

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'column',
          width: 800,
          height: 800,
          backgroundColor: themeColor,
          color: 'white',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 40,
          fontFamily: 'Roboto'
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100%',
                border: '4px solid rgba(255, 255, 255, 0.3)',
                borderRadius: 40,
                justifyContent: 'center',
                alignItems: 'center',
                padding: 40,
                textAlign: 'center'
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      marginBottom: 40
                    },
                    children: titleLines.map((line, i) => ({
                      type: 'span',
                      props: {
                        style: {
                          fontSize: i === 0 ? 30 : 60,
                          fontWeight: i === 0 ? 400 : 700,
                          letterSpacing: i === 0 ? 4 : 0,
                          marginTop: 10
                        },
                        children: line
                      }
                    }))
                  }
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 60,
                      fontWeight: 700,
                      marginBottom: 40
                    },
                    children: name
                  }
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      width: 100,
                      height: 4,
                      backgroundColor: 'rgba(255, 255, 255, 0.5)',
                      marginBottom: 40
                    }
                  }
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 32,
                      fontStyle: 'italic',
                      marginBottom: 60,
                      lineHeight: 1.4,
                      maxWidth: '80%'
                    },
                    children: message
                  }
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 24,
                      letterSpacing: 2,
                      textTransform: 'uppercase',
                      color: 'rgba(255, 255, 255, 0.8)'
                    },
                    children: `SENT WITH LOVE, ${(churchName || 'YOUR CHURCH').toUpperCase()}`
                  }
                }
              ]
            }
          }
        ]
      }
    } as any,
    {
      width: 800,
      height: 800,
      fonts: [
        {
          name: 'Roboto',
          data: robotoRegular,
          weight: 400,
          style: 'normal',
        },
        {
          name: 'Roboto',
          data: robotoBold,
          weight: 700,
          style: 'normal',
        }
      ],
    }
  );

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 800 },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  return pngBuffer;
}
