export const platforms = {
  zhihu: { url: 'https://zhuanlan.zhihu.com/write', title: ['textarea[placeholder*="标题"]', 'input[placeholder*="标题"]'], editor: ['div[contenteditable="true"]'], draft: ['保存草稿'], publish: ['发布'] },
  baijiahao: { url: 'https://baijiahao.baidu.com/builder/rc/edit', title: ['textarea[placeholder*="标题"]', 'input[placeholder*="标题"]'], editor: ['div[contenteditable="true"]', '.ProseMirror'], draft: ['存草稿', '保存草稿'], publish: ['发布'] },
  toutiao: { url: 'https://mp.toutiao.com/profile_v4/graphic/publish', title: ['textarea[placeholder*="标题"]', 'input[placeholder*="标题"]'], editor: ['div[contenteditable="true"]', '.ProseMirror'], draft: ['保存草稿'], publish: ['发布'] },
  sohu: { url: 'https://mp.sohu.com/mpfe/v4/main/news/addarticle', title: ['textarea[placeholder*="标题"]', 'input[placeholder*="标题"]'], editor: ['div[contenteditable="true"]', '.ProseMirror'], draft: ['保存草稿'], publish: ['发布'] },
};
