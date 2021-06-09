import Layout from "@/components/Layout";
import Newspaper, { INewspaper } from "@/models/Newspaper";
import { IUser } from "@/models/User";
import { NewspaperActions } from "@/util/actions";
import { jsonify } from "@/util/apiHelpers";
import { getCurrentUser } from "@/util/auth";
import { refreshData, request, showToast } from "@/util/ui";
import { Button } from "@chakra-ui/button";
import { FormControl, FormLabel } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { useToast } from "@chakra-ui/toast";
import { useRouter } from "next/router";
import { destroyCookie, parseCookies } from "nookies";
import { useState } from "react";


interface IWriteArticlePage {
  user: IUser,
  isAuthenticated: boolean,
  newspaper: INewspaper,
}

const EMPTY_DELTA: any = { ops: [] };

const WriteArticlePage: React.FC<IWriteArticlePage> = ({ user, newspaper, ...props }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();
  const [editorValue, setEditorValue] = useState(EMPTY_DELTA);
  const [articleName, setArticleName] = useState('');

  const ReactQuill = typeof window === 'object' ? require('react-quill') : () => false;

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
      ['link', 'image'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image',
  ];

  const handleEditorChange = (_value, _delta, _source, editor) => {
    setEditorValue(editor.getContents());
  }

  const handlePublish = () => {
    let payload = {
      action: NewspaperActions.PUBLISH_ARTICLE,
      data: {
        news_id: newspaper._id,
        article: {
          title: articleName,
          content: editorValue,
          country: user && user.country,
        },
      },
    };

    request({
      url: '/api/newspapers/doAction',
      method: 'POST',
      payload,
      token: cookies.token,
    }).then(data => {
      if (data.success) {
        showToast(toast, 'success', data?.message);
        setArticleName('');
        setEditorValue(EMPTY_DELTA);
        refreshData(router);
        router.push(`/newspaper/${newspaper._id}`);
      } else {
        showToast(toast, 'error', 'Publish Article Failed', data?.error);
      }
    });
  }

  const handleSave = () => {
    let payload = {
      action: NewspaperActions.SAVE_ARTICLE,
      data: {
        news_id: newspaper._id,
        article: {
          title: articleName,
          content: editorValue,
        },        
      },
    };

    request({
      url: '/api/newspapers/doAction',
      method: 'POST',
      payload,
      token: cookies.token,
    }).then(data => {
      if (data.success) {
        showToast(toast, 'success', data?.message);
        setEditorValue(EMPTY_DELTA);
        setArticleName('');
        refreshData(router);
        router.push(`/newspaper/${newspaper._id}`);
      } else {
        showToast(toast, 'error', 'Save Article Failed', data?.error);
      }
    });
  }

  return user ? (
    <Layout user={user}>
      <div className='flex justify-between items-center px-2 md:px-0 md:pr-8'>
        <h1 className='text-2xl text-accent font-semibold'>Write Article</h1>
        <div className='flex gap-4'>
          <Button size='sm' variant='solid' colorScheme='blue' onClick={handlePublish}>Publish</Button>
          <Button size='sm' variant='solid' colorScheme='green' onClick={handleSave}>Save Draft</Button>
        </div>
      </div>
      <div className='mt-8 mx-2 md:mx-0 md:mr-8 bg-night pt-2 pb-3 px-4 min-h-max rounded shadow-md'>
        <div className='text-white'>
          <FormControl>
            <FormLabel>Article Name</FormLabel>
            <Input type='text' value={articleName} onChange={e => setArticleName(e.target.value)} />
          </FormControl>
        </div>
        <div className='mt-4'>        
          <ReactQuill
            className='h-max rounded shadow-md text-white'
            theme='snow'
            modules={modules}
            formats={formats}
            value={editorValue}
            onChange={handleEditorChange}
          />
        </div>
      </div>
    </Layout>
  ) : null;
}

export const getServerSideProps = async ctx => {
  let { req, params } = ctx;

  let result = await getCurrentUser(req);
  if (!result.isAuthenticated) {
    destroyCookie(ctx, 'token');
    return {
      redirect: {
        permanent: false,
        destination: '/login',
      },
    };
  }

  let newspaper: INewspaper = await Newspaper.findOne({ _id: Number.parseInt(params.id)});

  return {
    props: { ...result, newspaper: jsonify(newspaper) },
  };
}

export default WriteArticlePage;