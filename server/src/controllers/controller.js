const controller = ({ strapi }) => ({
  index(ctx) {
    ctx.body = strapi
      .plugin('export-to-hugo')
      // the name of the service file & the method.
      .service('service')
      .getWelcomeMessage();
  },
  async contentTypeGenerator(ctx) {
    let results = [];
    try {
      let hasNewCreated = false;
      let hasExisting = false;
      let hasFailed = false;
      
      // 用于跟踪每个content type的状态
      const statusTracker = {
        existing: [],
        created: [],
        failed: []
      };
      
      const fs = require('fs');
      const path = require('path');
      
      // 定义所有需要创建的content types
      const contentTypes = [
        {
          name: 'pagination',
          displayName: '分页管理',
          kind: 'singleType',
          attributes: {
            disableAliases: {
              type: 'boolean',
              default: false,
              required: true
            },
            pagerSize: {
              type: 'integer',
              default: 10,
              required: true
            },
            path: {
              type: 'string',
              default: 'page',
              required: true
            }
          }
        },
        {
          name: 'data',
          displayName: '数据管理',
          kind: 'collectionType',
          attributes: {
            key: { 
              type: 'string', 
              required: true,
              unique: true
            },
            value: { 
              type: 'text',
              required: true
            },
            remark: {
              type: 'string',
              required: false
            }
          }
        },
        {
          name: 'article',
          displayName: '文章管理',
          kind: 'collectionType',
          attributes: {
            menu: { type: 'relation', relation: 'oneToOne', target: 'api::menu.menu', required: true },
            title: { type: 'string', required: true },
            slug: { type: 'uid', targetField: 'title', required: true },
            weight: { type: 'integer', default: 0 },
            draft: { type: 'boolean', default: false },
            date: { type: 'datetime' },
            images: { type: 'media', multiple: true },
            content: { type: 'richtext' },
            feature: { type: 'json' },
            keywords: { type: 'json' },
            description: { type: 'text' },
            supplier: { type: 'string' }
          }
        },
        {
          name: 'menu',
          displayName: '菜单管理',
          kind: 'collectionType',
          attributes: {
            name: { type: 'string', required: true },
            pageref: { type: 'string', required: true },
            weight: { type: 'integer', default: 0, required: true },
            parent: { type: 'relation', relation: 'oneToOne', target: 'api::menu.menu' },
            page: { 
              type: 'boolean',
              default: false
            },
            draft: { type: 'boolean', default: false },
            date: { type: 'datetime' },
            keywords: { type: 'json' },
            params: { type: 'json' }
          }
        },
        {
          name: 'param',
          displayName: '参数管理',
          kind: 'singleType',
          attributes: {
            company: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            address: { type: 'string' },
            googleTagManagerCode: { type: 'string' }
          }
        },
        {
          name: 'config',
          displayName: '配置管理',
          kind: 'singleType',
          attributes: {
            baseURL: { type: 'string' },
            languageCode: { type: 'string' },
            title: { type: 'string' },
            theme: { type: 'string' }
          }
        }
      ];

      // 获取项目根目录
      const getProjectRoot = () => {
        let currentDir = __dirname;
        while (currentDir !== path.parse(currentDir).root) {
          const parentDir = path.dirname(currentDir);
          if (fs.existsSync(path.join(parentDir, 'strapi'))) {
            return parentDir;
          }
          currentDir = parentDir;
        }
        return __dirname;
      };

      const projectRoot = getProjectRoot();
      const apiDir = path.join(projectRoot, 'strapi', 'src', 'api');

      // 处理每个content type
      for (const contentType of contentTypes) {
        const contentTypeId = `api::${contentType.name}.${contentType.name}`;
        console.log(`处理 ${contentType.displayName}...`);
        
        try {
          // 检查content type是否存在
          const existingContentType = strapi.contentType(contentTypeId);
          if (existingContentType) {
            statusTracker.existing.push({
              name: contentType.displayName,
              type: contentType.name,
              message: '已存在',
              details: {
                uid: existingContentType.uid,
                kind: existingContentType.kind
              }
            });
            results.push(`${contentType.displayName}已存在，跳过创建`);
            hasExisting = true;
            continue;
          }

          // 如果不存在，则创建schema文件
          console.log(`开始创建 ${contentType.displayName}...`);
          
          // 创建内容类型目录
          const contentTypeDir = path.join(apiDir, contentType.name);
          const contentTypesDir = path.join(contentTypeDir, 'content-types');
          const schemaDir = path.join(contentTypesDir, contentType.name);
          
          // 确保目录存在
          fs.mkdirSync(schemaDir, { recursive: true });
          
          // 创建schema.json文件
          const schema = {
            kind: contentType.kind,
            collectionName: contentType.name,
            info: {
              displayName: contentType.displayName,
              singularName: contentType.name,
              pluralName: contentType.name + 's',
              description: `${contentType.displayName}内容类型`
            },
            options: {
              draftAndPublish: true
            },
            attributes: contentType.attributes
          };

          const schemaPath = path.join(schemaDir, 'schema.json');
          fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2));
          
          statusTracker.created.push({
            name: contentType.displayName,
            type: contentType.name,
            message: '创建成功',
            schema: schema,
            path: path.relative(projectRoot, schemaPath)
          });
          results.push(`${contentType.displayName}创建成功，请重启Strapi服务以生效`);
          hasNewCreated = true;
          
        } catch (error) {
          console.error(`${contentType.displayName}处理失败:`, error);
          statusTracker.failed.push({
            name: contentType.displayName,
            type: contentType.name,
            error: error.message,
            stack: error.stack,
            details: {
              message: error.message,
              code: error.code,
              name: error.name,
              phase: error.message.includes('already exists') ? '检查阶段' : '创建阶段'
            }
          });
          results.push(`${contentType.displayName}处理失败: ${error.message}`);
          hasFailed = true;
        }
      }

      // 生成详细的消息
      let message = '';
      const existingNames = statusTracker.existing.map(item => item.name).join('、');
      const createdNames = statusTracker.created.map(item => item.name).join('、');
      const failedNames = statusTracker.failed.map(item => item.name).join('、');
      const failedErrors = statusTracker.failed.map(item => `${item.name}(${item.error})`).join('、');

      if (hasExisting && !hasNewCreated && !hasFailed) {
        message = `所有Content-Type已存在，无需创建。已存在的内容类型：${existingNames}`;
      } else if (hasExisting && hasNewCreated && !hasFailed) {
        message = `部分Content-Type已存在，其余创建成功。\n已存在：${existingNames}\n创建成功：${createdNames}\n请重启Strapi服务以生效`;
      } else if (!hasExisting && hasNewCreated && !hasFailed) {
        message = `所有Content-Type创建成功。创建成功的内容类型：${createdNames}\n请重启Strapi服务以生效`;
      } else if (hasFailed) {
        message = `部分Content-Type创建失败。\n已存在：${existingNames}\n创建成功：${createdNames}\n创建失败：${failedNames}\n失败原因：${failedErrors}\n${hasNewCreated ? '请重启Strapi服务以生效' : ''}`;
      }

      ctx.body = {
        success: !hasFailed,
        message,
        results,
        debug: {
          hasExisting,
          hasNewCreated,
          hasFailed,
          status: {
            existing: statusTracker.existing,
            created: statusTracker.created,
            failed: statusTracker.failed
          },
          logs: results,
          summary: {
            total: contentTypes.length,
            existing: statusTracker.existing.length,
            created: statusTracker.created.length,
            failed: statusTracker.failed.length
          }
        }
      };
    } catch (error) {
      console.error('Content-Type生成错误:', error);
      ctx.body = {
        success: false,
        message: `Content-Type生成操作失败：${error.message}`,
        error: error.message,
        stack: error.stack,
        results: results || [],
        debug: {
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
            code: error.code
          }
        }
      };
    }
  },
  async updateWebsiteFiles(ctx) {
    try {
      const fs = require('fs');
      const path = require('path');
      const results = [];

      // 获取项目根目录
      const getProjectRoot = () => {
        let currentDir = __dirname;
        while (currentDir !== path.parse(currentDir).root) {
          const parentDir = path.dirname(currentDir);
          if (fs.existsSync(path.join(parentDir, 'strapi')) && 
              fs.existsSync(path.join(parentDir, 'hugo'))) {
            return parentDir;
          }
          currentDir = parentDir;
        }
        return __dirname;
      };

      const projectRoot = getProjectRoot();
      const hugoRootDir = path.join(projectRoot, 'hugo');

      // 清理目录函数
      const cleanDirectory = (dirPath) => {
        if (fs.existsSync(dirPath)) {
          const files = fs.readdirSync(dirPath);
          for (const file of files) {
            const filePath = path.join(dirPath, file);
            if (fs.lstatSync(filePath).isDirectory()) {
              cleanDirectory(filePath);
              fs.rmdirSync(filePath);
            } else {
              fs.unlinkSync(filePath);
            }
          }
        }
      };

      // 清理需要重新生成的目录
      const directoriesToClean = [
        path.join(hugoRootDir, 'config/_default'),
        path.join(hugoRootDir, 'content'),
        path.join(hugoRootDir, 'static/uploads')
      ];

      for (const dir of directoriesToClean) {
        if (fs.existsSync(dir)) {
          cleanDirectory(dir);
          results.push(`已清理目录: ${path.relative(projectRoot, dir)}`);
        }
      }

      // 确保必要的目录存在
      const hugoContentDir = path.join(hugoRootDir, 'content');
      const uploadsDir = path.join(hugoRootDir, 'static/uploads');
      const hugoConfigDir = path.join(hugoRootDir, 'config/_default');

      if (!fs.existsSync(hugoContentDir)) {
        fs.mkdirSync(hugoContentDir, { recursive: true });
      }
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      if (!fs.existsSync(hugoConfigDir)) {
        fs.mkdirSync(hugoConfigDir, { recursive: true });
      }

      // 处理文章
      const articles = await strapi.entityService.findMany('api::article.article', {
        populate: '*',
      });

      const processedImages = new Set();
      const exportResults = [];

      for (const article of articles) {
        if (!article.menu || !article.menu.pageref) {
          console.log(`文章 ${article.title} 没有关联菜单或菜单没有pageref，跳过导出`);
          continue;
        }

        const targetDir = path.join(hugoContentDir, article.menu.pageref.toLowerCase());
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        // 获取文章内容类型的所有字段
        const contentType = strapi.contentType('api::article.article');
        const attributes = contentType.attributes;

        // 动态构建front matter对象
        const frontMatter = {};
        
        // 遍历所有字段
        for (const [key, attribute] of Object.entries(attributes)) {
          if (['id', 'createdAt', 'updatedAt', 'publishedAt', 'createdBy', 'updatedBy', 'localizations', 'locale', 'localizedFields'].includes(key) || 
              key.startsWith('_') || 
              attribute.type === 'relation') {
            continue;
          }

          const value = article[key];

          if (value !== undefined && value !== null) {
            if (attribute.type === 'media') {
              if (Array.isArray(value)) {
                frontMatter[key] = value.map(item => {
                  const imageUrl = item.url;
                  const imagePath = path.join(projectRoot, 'strapi/public', imageUrl);
                  const targetPath = path.join(uploadsDir, path.basename(imageUrl));
                  
                  if (!processedImages.has(imageUrl)) {
                    if (fs.copyFileSync(imagePath, targetPath)) {
                      processedImages.add(imageUrl);
                    }
                  }

                  return {
                    url: `/uploads/${path.basename(imageUrl)}`,
                    alternativeText: item.alternativeText || '',
                    width: item.width,
                    height: item.height
                  };
                });
              } else if (value) {
                const imageUrl = value.url;
                const imagePath = path.join(projectRoot, 'strapi/public', imageUrl);
                const targetPath = path.join(uploadsDir, path.basename(imageUrl));
                
                if (!processedImages.has(imageUrl)) {
                  if (fs.copyFileSync(imagePath, targetPath)) {
                    processedImages.add(imageUrl);
                  }
                }

                frontMatter[key] = {
                  url: `/uploads/${path.basename(imageUrl)}`,
                  alternativeText: value.alternativeText || '',
                  width: value.width,
                  height: value.height
                };
              }
            } else {
              frontMatter[key] = value;
            }
          }
        }

        const frontMatterStr = '---\n' + 
          Object.entries(frontMatter)
            .filter(([_, value]) => value !== undefined && value !== null)
            .map(([key, value]) => {
              if (Array.isArray(value)) {
                return `${key}:\n${value.map(item => `  - ${JSON.stringify(item)}`).join('\n')}`;
              }
              return `${key}: ${JSON.stringify(value)}`;
            })
            .join('\n') + 
          '\n---\n\n';

        const markdownContent = frontMatterStr + (article.content || '');
        const outputPath = path.join(targetDir, `${article.slug}.md`);

        // 处理文章内容中的图片
        if (article.content) {
          // 使用正则表达式匹配 Markdown 格式的图片
          const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
          let match;
          let processedContent = article.content;

          while ((match = imgRegex.exec(article.content)) !== null) {
            const altText = match[1];
            const originalImgUrl = match[2];
            const originalMarkdown = match[0];

            // 检查是否是完整的URL（包含域名）
            if (originalImgUrl.startsWith('http')) {
              try {
                // 从URL中提取文件名
                const fileName = originalImgUrl.split('/').pop();
                
                // 构建源文件路径
                const uploadsPath = originalImgUrl.split('/uploads/')[1];
                const sourcePath = path.join(projectRoot, 'strapi', 'public', 'uploads', uploadsPath);
                
                // 确保目标目录存在
                if (!fs.existsSync(uploadsDir)) {
                  fs.mkdirSync(uploadsDir, { recursive: true });
                }
                
                const targetPath = path.join(uploadsDir, fileName);

                // 复制图片文件
                if (fs.existsSync(sourcePath)) {
                  try {
                    fs.copyFileSync(sourcePath, targetPath);
                    console.log(`已复制图片: ${fileName}`);
                    console.log(`源路径: ${sourcePath}`);
                    console.log(`目标路径: ${targetPath}`);
                  } catch (copyError) {
                    console.error(`复制图片失败: ${fileName}`, copyError);
                  }
                } else {
                  console.error(`源图片不存在: ${sourcePath}`);
                }

                // 替换图片URL为相对路径
                const newMarkdown = `![${altText}](/uploads/${fileName})`;
                processedContent = processedContent.replace(originalMarkdown, newMarkdown);
              } catch (error) {
                console.error(`处理图片失败: ${originalImgUrl}`, error);
              }
            }
          }

          // 使用处理后的内容
          fs.writeFileSync(outputPath, frontMatterStr + processedContent);
        } else {
          fs.writeFileSync(outputPath, markdownContent);
        }

        exportResults.push({
          title: article.title,
          path: path.relative(projectRoot, outputPath),
          menu: article.menu.name
        });
      }

      // 处理菜单
      const menus = await strapi.entityService.findMany('api::menu.menu', {
        populate: ['parent'],
        orderBy: { weight: 'asc' },
      });

      const menuNameMap = new Map();
      menus.forEach(menu => {
        menuNameMap.set(menu.id, menu.name);
      });

      const menuItems = menus
        .filter(item => item && item.name && item.pageref)
        .map(item => {
          const menuItem = {
            name: item.name,
            pageRef: item.pageref.toLowerCase(),
            weight: item.weight || 0,
            page: item.page === true
          };

          if (item.params) {
            menuItem.params = item.params;
          }

          if (item.parent && menuNameMap.has(item.parent.id)) {
            menuItem.parent = menuNameMap.get(item.parent.id);
          }

          return menuItem;
        });

      const hugoMenu = {
        main: menuItems
      };

      const menuJsonPath = path.join(hugoConfigDir, 'menu.json');
      fs.writeFileSync(menuJsonPath, JSON.stringify(hugoMenu, null, 2));

      // 为每个菜单项创建 _index.md 或 index.md
      const createdIndexFiles = [];
      for (const item of menuItems) {
        if (item.pageRef) {
          const targetDir = path.join(hugoContentDir, item.pageRef);
          
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }

          const frontmatter = {
            title: item.name
          };

          const markdown = `---
title: "${item.name}"
---

`;

          // 根据 page 字段决定文件名
          const fileName = item.page ? 'index.md' : '_index.md';
          const indexPath = path.join(targetDir, fileName);
          fs.writeFileSync(indexPath, markdown);
          createdIndexFiles.push({
            path: path.relative(projectRoot, indexPath),
            menu: item.name
          });
        }
      }

      // 处理系统配置
      const config = await strapi.db.query('api::config.config').findOne();
      if (config) {
        // 获取配置管理的content type定义
        const configContentType = strapi.contentType('api::config.config');
        
        // 动态构建配置对象
        const customConfig = {};
        
        // 遍历所有字段
        for (const [key, attribute] of Object.entries(configContentType.attributes)) {
          // 排除系统字段和关系字段
          if (!['id', 'createdAt', 'updatedAt', 'publishedAt', 'createdBy', 'updatedBy', 'localizations', 'locale', 'localizedFields'].includes(key) && 
              !key.startsWith('_') && 
              attribute.type !== 'relation') {
            // 获取字段值，如果不存在则使用空字符串作为默认值
            customConfig[key] = config[key] || '';
          }
        }

        const configJsonPath = path.join(hugoConfigDir, 'config.json');
        fs.writeFileSync(configJsonPath, JSON.stringify(customConfig, null, 2));
        results.push('系统配置已更新');
      }

      // 处理参数设置
      const paramData = await strapi.db.query('api::param.param').findOne();
      if (paramData) {
        // 获取参数管理的content type定义
        const paramContentType = strapi.contentType('api::param.param');
        
        // 动态构建配置对象
        const hugoConfig = {};
        
        // 遍历所有字段
        for (const [key, attribute] of Object.entries(paramContentType.attributes)) {
          // 排除系统字段和关系字段
          if (!['id', 'createdAt', 'updatedAt', 'publishedAt', 'createdBy', 'updatedBy', 'localizations', 'locale', 'localizedFields'].includes(key) && 
              !key.startsWith('_') && 
              attribute.type !== 'relation') {
            // 获取字段值，如果不存在则使用空字符串作为默认值
            hugoConfig[key] = paramData[key] || '';
          }
        }

        const paramsJsonPath = path.join(hugoConfigDir, 'params.json');
        fs.writeFileSync(paramsJsonPath, JSON.stringify(hugoConfig, null, 2));
        results.push('参数设置已更新');
      }

      // 处理数据管理
      const dataItems = await strapi.entityService.findMany('api::data.data', {
        populate: '*',
      });

      if (dataItems && dataItems.length > 0) {
        // 创建 data 目录
        const dataDir = path.join(hugoRootDir, 'data');
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }

        // 将数据转换为键值对格式，排除 remark 字段
        const dataConfig = {};
        dataItems.forEach(item => {
          if (item.key && item.value) {
            dataConfig[item.key] = item.value;
          }
        });

        // 导出到 data.json
        const dataJsonPath = path.join(dataDir, 'data.json');
        fs.writeFileSync(dataJsonPath, JSON.stringify(dataConfig, null, 2));
        results.push('数据管理配置已导出');
      }

      // 导出分页管理（pagination）
      const pagination = await strapi.db.query('api::pagination.pagination').findOne();
      if (pagination) {
        // 获取分页管理的content type定义
        const paginationContentType = strapi.contentType('api::pagination.pagination');
        
        // 动态构建配置对象
        const paginationConfig = {};
        
        // 遍历所有字段
        for (const [key, attribute] of Object.entries(paginationContentType.attributes)) {
          // 排除系统字段和关系字段
          if (!['id', 'createdAt', 'updatedAt', 'publishedAt', 'createdBy', 'updatedBy', 'localizations', 'locale', 'localizedFields'].includes(key) && 
              !key.startsWith('_') && 
              attribute.type !== 'relation') {
            // 获取字段值，如果不存在则使用默认值
            paginationConfig[key] = pagination[key] ?? attribute.default ?? '';
          }
        }

        const paginationJsonPath = path.join(hugoConfigDir, 'pagination.json');
        fs.writeFileSync(paginationJsonPath, JSON.stringify(paginationConfig, null, 2));
        results.push('分页管理配置已导出');
      }

      ctx.body = {
        success: true,
        message: '网站文件更新完成',
        data: {
          menuPath: path.relative(projectRoot, menuJsonPath),
          menuCount: menuItems.length,
          menuItems: menuItems,
          createdIndexFiles: createdIndexFiles,
          totalExported: exportResults.length,
          results: exportResults,
          cleanedDirectories: directoriesToClean.map(dir => path.relative(projectRoot, dir))
        }
      };
    } catch (error) {
      ctx.body = {
        success: false,
        message: '网站文件更新失败',
        error: error.message
      };
    }
  },
  async syncToServer(ctx) {
    // 这里写你的业务逻辑
    ctx.body = { message: '同步到服务器操作成功' };
  },
});
export default controller;

